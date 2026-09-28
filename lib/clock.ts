import { RUNTIME } from '@/content/film';
import { TOTAL_VH, timeToVh, vhToTime } from './timeline';

// The film's one clock. Film time comes from one of two sources:
//   scroll  native scroll position, damped for a soft, iOS-like follow
//   play    wall time, when the viewer presses Play (a 90-second presentation)
// Renderers only ever see film time. React never sees per-frame values.
//
// While playing, the clock keeps the page scrolled to match, so the rail,
// anchors and scrollbar stay true; if the viewer scrolls, playback pauses and
// scroll takes over from exactly where the film is.
//
// The opening also plays itself up to INTRO_END (the title revealed), so the
// first screen is never static. Film time is max(scroll time, intro time).

export type Renderer = (t: number) => void;
type StateListener = (playing: boolean, t: number) => void;

const TAU = 0.1;
const SNAP_SECONDS = 4;
export const INTRO_END = 5.6;
const INTRO_DELAY = 0.9;

export class FilmClock {
  t = 0;
  playing = false;
  private scrollT = 0;
  private introT = 0;       // a floor under scroll time while the opening plays itself
  private introRunning = false;
  private introStart = 0;
  private playBase = 0;
  private playStart = 0;
  private setScroll = -1;
  private renderers = new Set<Renderer>();
  private listeners = new Set<StateListener>();
  private raf = 0;
  private last = 0;
  private maxScroll = 1;

  constructor(private damping: boolean) {}

  start() {
    this.measure();
    this.scrollT = this.readTarget();
    this.introRunning = this.damping && this.scrollT < 0.05;
    this.introT = 0;
    this.introStart = performance.now() + INTRO_DELAY * 1000;
    this.t = Math.max(this.scrollT, this.introT);
    this.emit();
    window.addEventListener('scroll', this.wake, { passive: true });
    window.addEventListener('resize', this.onResize);
    this.wake();
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    window.removeEventListener('scroll', this.wake);
    window.removeEventListener('resize', this.onResize);
  }

  subscribe(r: Renderer) {
    this.renderers.add(r);
    r(this.t);
    return () => this.renderers.delete(r);
  }

  onState(l: StateListener) {
    this.listeners.add(l);
    l(this.playing, this.t);
    return () => this.listeners.delete(l);
  }

  // ---- presentation ------------------------------------------------------

  play() {
    if (this.playing) return;
    this.endIntro();
    this.playBase = this.t >= RUNTIME - 0.05 ? 0 : this.t;
    this.playStart = performance.now();
    this.playing = true;
    document.documentElement.classList.add('is-playing');
    this.notify();
    this.wake();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    document.documentElement.classList.remove('is-playing');
    this.syncScroll(this.t);
    this.scrollT = this.t;
    this.notify();
  }

  toggle() {
    if (this.playing) this.pause(); else this.play();
  }

  /** Jump to a film time. Keeps playing if playing; otherwise the scroll glides there. */
  seek(t: number) {
    t = Math.min(RUNTIME, Math.max(0, t));
    if (this.playing) {
      this.playBase = t;
      this.playStart = performance.now();
      this.wake();
    } else {
      this.endIntro();
      this.syncScroll(t, false);
    }
  }

  private endIntro() {
    this.introRunning = false;
    this.introT = 0;
  }

  /** Where the film is headed: the scroll target (undamped), or the intro/playhead if ahead. */
  get targetTime() {
    return this.playing ? this.t : Math.max(this.readTarget(), this.introT);
  }

  scrollFor(t: number) {
    return (timeToVh(t) / TOTAL_VH) * this.maxScroll;
  }

  // ---- internals ---------------------------------------------------------

  private syncScroll(t: number, silent = true) {
    const y = Math.round(this.scrollFor(t));
    if (silent) this.setScroll = y;
    window.scrollTo(0, y);
  }

  private measure() {
    this.maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  private readTarget() {
    const p = Math.min(1, Math.max(0, window.scrollY / this.maxScroll));
    return vhToTime(p * TOTAL_VH);
  }

  private onResize = () => {
    this.measure();
    this.wake();
  };

  private wake = () => {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  };

  private frame = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    let t: number;

    if (this.playing) {
      // The viewer scrolled during playback: hand the film back to scroll.
      if (this.setScroll >= 0 && Math.abs(window.scrollY - this.setScroll) > 4) {
        this.playing = false;
        document.documentElement.classList.remove('is-playing');
        this.scrollT = this.t;
        this.notify();
        this.raf = requestAnimationFrame(this.frame);
        return;
      }
      t = Math.min(RUNTIME, this.playBase + (now - this.playStart) / 1000);
      this.scrollT = t;
      this.syncScroll(t);
      if (t >= RUNTIME) {
        this.t = t;
        this.emit();
        this.pause();
        this.raf = 0;
        return;
      }
    } else {
      this.setScroll = -1;
      if (this.introRunning) {
        this.introT = Math.min(INTRO_END, Math.max(0, (now - this.introStart) / 1000));
        if (this.introT >= INTRO_END) this.introRunning = false;
      }
      const target = this.readTarget();
      const d = target - this.scrollT;
      if (!this.damping || Math.abs(d) > SNAP_SECONDS || Math.abs(d) < 0.0005) this.scrollT = target;
      else this.scrollT += d * (1 - Math.exp(-dt / TAU));
      // Once scroll passes the opening, scroll alone is the playhead.
      if (!this.introRunning && this.scrollT >= this.introT) this.introT = 0;
      t = Math.max(this.scrollT, this.introT);
    }

    if (t !== this.t) {
      this.t = t;
      this.emit();
    }
    const settled = !this.playing && !this.introRunning && this.scrollT === this.readTarget();
    this.raf = settled ? 0 : requestAnimationFrame(this.frame);
  };

  private emit() {
    for (const r of this.renderers) r(this.t);
  }

  private notify() {
    for (const l of this.listeners) l(this.playing, this.t);
  }
}
