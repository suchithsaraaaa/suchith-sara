'use client';

import { useEffect, useRef } from 'react';
import { scenes } from '@/content/film';
import { range, setStyle } from '@/lib/anim';
import { FilmClock } from '@/lib/clock';
import { collectCues, createCueRenderer } from '@/lib/cues';
import { PlateManager } from '@/lib/plates';
import { Sound } from '@/lib/sound';
import { formatLength, nextBeat, TOTAL_VH, timeToVh } from '@/lib/timeline';
import { MAP_T } from '@/scenes/map/geometry';
import { createMapAnimator } from '@/scenes/map/animate';
import { createHudRenderer, Hud, PlayIcon } from './Hud';

// The point of light is on screen only in the black moments between footage.
// Each window is [fade in from, fully on, fade out from, gone].
const POINT: [number, number, number, number][] = [
  [-1, 0, 1.2, 2.0],
  [38.3, 38.9, 42.3, 42.9],
  [70.0, 70.3, 74.2, 74.6],
  [77.5, 77.8, 78.1, 78.4],
  [84.0, 84.4, 85.2, 85.8],
];

// Soft snap points: one per counter detent, plus the amber frame.
const SNAPS = [0, 1, 2, 3, 4].map((i) => MAP_T.counter + MAP_T.step * (i + 0.5)).concat(MAP_T.amber + 0.45);

// The sticky stage and its one clock. React renders this tree once; after
// mount every per-frame change is written imperatively by the renderers.
export function Film({ children }: { children: React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = new FilmClock(!reduced);
    const off: (() => void)[] = [];

    const plates = new PlateManager(Array.from(stage.querySelectorAll('video')), reduced);
    off.push(clock.subscribe((t) => plates.render(t)));

    off.push(clock.subscribe(createCueRenderer(collectCues(stage), reduced)));

    const mapRoot = stage.querySelector<HTMLElement>('[data-scene="the-map"]');
    const map = mapRoot ? createMapAnimator(mapRoot, reduced) : null;
    if (map) off.push(clock.subscribe(map.render));

    const point = stage.querySelector<HTMLElement>('[data-point]');
    off.push(clock.subscribe((t) => {
      let o = 0;
      for (const [a, b, c, d] of POINT) o = Math.max(o, range(t, a, b) * (1 - range(t, c, d)));
      setStyle(point, 'opacity', o.toFixed(3));
      // Only the opening point bursts; later it is the same small light.
      const burst = t < 2.1 ? range(t, 1.2, 2.0) : 0;
      setStyle(point, 'transform', reduced ? 'none' : `scale(${(1 + burst * 2.5).toFixed(3)})`);
    }));

    const sound = new Sound();
    off.push(clock.subscribe((t) => sound.render(t)));
    const soundButton = stage.querySelector<HTMLButtonElement>('[data-sound]');
    const toggleSound = () => {
      if (sound.enabled) sound.disable(); else sound.enable();
      soundButton?.setAttribute('aria-pressed', String(sound.enabled));
      if (soundButton) soundButton.textContent = sound.enabled ? 'Sound on' : 'Sound off';
    };

    off.push(clock.subscribe(createHudRenderer(stage)));

    // Chrome recedes while the film is moving and returns when it rests.
    let rest = 0, lastT = -1;
    off.push(clock.subscribe((t) => {
      if (t === lastT) return;
      lastT = t;
      stage.classList.add('is-moving');
      clearTimeout(rest);
      rest = window.setTimeout(() => stage.classList.remove('is-moving'), 800);
    }));

    // Play / pause controls reflect the clock's state.
    const playButtons = Array.from(stage.querySelectorAll<HTMLButtonElement>('[data-play]'));
    const cta = stage.querySelector<HTMLElement>('[data-cta]');
    let started = false;
    off.push(clock.onState((playing) => {
      started ||= playing;
      stage.classList.toggle('is-playing', playing);
      for (const b of playButtons) {
        b.setAttribute('aria-pressed', String(playing));
        b.setAttribute('aria-label', playing ? 'Pause the film' : 'Play the film');
      }
    }));
    off.push(clock.subscribe((t) => {
      const show = !started && !clock.playing && t < 6.8;
      setStyle(cta, 'opacity', show ? String(range(t, 1.6, 3.2)) : '0');
      setStyle(cta, 'visibility', show ? 'visible' : 'hidden');
    }));

    clock.start();
    plates.warm();

    const go = (t: number) => clock.seek(t);

    const onKey = (e: KeyboardEvent) => {
      const el = e.target instanceof Element ? e.target : document.body;
      if (e.metaKey || e.ctrlKey || e.altKey || el.closest('input, textarea, select, [contenteditable]')) return;
      const k = e.key;
      if (k === ' ' && el.closest('button, a')) return;
      if (k === ' ' || k === 'k' || k === 'K') {
        e.preventDefault();
        clock.toggle();
      } else if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown') {
        e.preventDefault();
        go(nextBeat(clock.targetTime, 1));
      } else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp') {
        e.preventDefault();
        go(nextBeat(clock.targetTime, -1));
      } else if (k >= '1' && k <= '8') {
        go(scenes[Number(k) - 1].t0);
      } else if (k === 'Home') {
        e.preventDefault();
        go(0);
      } else if (k === 'End') {
        e.preventDefault();
        go(90);
      } else if (k === 'm' || k === 'M') {
        toggleSound();
      }
    };
    window.addEventListener('keydown', onKey);

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const a = target.closest<HTMLAnchorElement>('a[data-scene-link]');
      if (a) {
        // Land on the exact film time rather than the approximate anchor.
        e.preventDefault();
        go(scenes.find((x) => x.id === a.dataset.sceneLink)!.t0);
        history.replaceState(null, '', a.hash);
      } else if (target.closest('[data-replay]')) {
        go(0);
        clock.play();
      } else if (target.closest('[data-cta]')) {
        // The big Play is the moment someone commits to watching: bring the sound up with it.
        if (!sound.enabled) toggleSound();
        clock.play();
      } else if (target.closest('[data-play]')) {
        clock.toggle();
      } else if (target.closest('[data-sound]')) {
        toggleSound();
      }
    };
    stage.addEventListener('click', onClick);

    return () => {
      clock.stop();
      off.forEach((f) => f());
      map?.dispose();
      plates.dispose();
      sound.dispose();
      clearTimeout(rest);
      window.removeEventListener('keydown', onKey);
      stage.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div className="film-track" style={{ height: `calc(${TOTAL_VH + 100} * 1svh)` }}>
      {scenes.map((s) => (
        <div key={s.id} id={`s-${s.id}`} className="film-anchor" style={{ top: `calc(${timeToVh(s.t0)} * 1svh)` }} />
      ))}
      {SNAPS.map((t) => (
        <div key={t} className="film-snap" style={{ top: `calc(${timeToVh(t)} * 1svh)` }} />
      ))}
      <div className="stage" ref={stageRef}>
        <div className="plates" aria-hidden="true">
          <video className="plate" muted playsInline preload="auto" disablePictureInPicture tabIndex={-1} />
          <video className="plate" muted playsInline preload="auto" disablePictureInPicture tabIndex={-1} />
        </div>
        <div className="vignette" aria-hidden="true" />
        {children}
        <div className="point-wrap" data-point aria-hidden="true">
          <div className="point" />
        </div>
        <div className="cta" data-cta>
          <button type="button" className="cta-play" data-play aria-pressed="false" aria-label="Play the film">
            <PlayIcon />
            <span className="mono">Play the film</span>
            <span className="mono cta-len">Sound on</span>
            <span className="mono cta-len">{formatLength()}</span>
          </button>
          <p className="mono cta-or">or scroll at your own pace</p>
        </div>
        <Hud />
      </div>
    </div>
  );
}
