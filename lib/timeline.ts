import { RUNTIME, scenes, warp, type Scene } from '@/content/film';

// Piecewise-linear map between scroll distance (in viewport heights) and film
// time (seconds). Built once from the scene table; every lookup is pure, so the
// same scroll position always yields the same film time in either direction.

type Knot = { vh: number; t: number };

const knots: Knot[] = [{ vh: 0, t: 0 }];
for (const s of scenes) {
  let t = s.t0;
  for (const [dt, vh] of s.segments) {
    t += dt;
    knots.push({ vh: knots[knots.length - 1].vh + vh, t });
  }
}

export const TOTAL_VH = knots[knots.length - 1].vh;

function lerpKnots(x: number, from: 'vh' | 't', to: 'vh' | 't'): number {
  if (x <= knots[0][from]) return knots[0][to];
  for (let i = 1; i < knots.length; i++) {
    const a = knots[i - 1], b = knots[i];
    if (x <= b[from]) return a[to] + ((x - a[from]) / (b[from] - a[from])) * (b[to] - a[to]);
  }
  return knots[knots.length - 1][to];
}

export const vhToTime = (vh: number) => lerpKnots(vh, 'vh', 't');
export const timeToVh = (t: number) => lerpKnots(t, 't', 'vh');

export function sceneIndexAt(t: number): number {
  for (let i = scenes.length - 1; i >= 0; i--) if (t >= scenes[i].t0) return i;
  return 0;
}

export function sceneAt(t: number): Scene {
  return scenes[sceneIndexAt(t)];
}

export const allBeats: number[] = Array.from(new Set(scenes.flatMap((s) => s.beats))).sort((a, b) => a - b);

export function nextBeat(t: number, dir: 1 | -1): number {
  const eps = 0.05;
  if (dir > 0) return allBeats.find((b) => b > t + eps) ?? RUNTIME;
  for (let i = allBeats.length - 1; i >= 0; i--) if (allBeats[i] < t - eps) return allBeats[i];
  return 0;
}

// ---- Presentation time ------------------------------------------------------
// Scenes are authored in film time (0–90). Some stretches are played slower so
// they can be read; `warp` lists them. Presentation time is what the viewer
// experiences: what Play advances at 1×, and what the timecode shows.

const pres: { a: number; p: number }[] = [{ a: 0, p: 0 }];
{
  let a = 0, p = 0;
  for (const [a0, a1, rate] of warp) {
    p += a0 - a; // unwarped stretch before this one
    pres.push({ a: a0, p });
    p += (a1 - a0) / rate;
    pres.push({ a: a1, p });
    a = a1;
  }
  pres.push({ a: RUNTIME, p: p + (RUNTIME - a) });
}

function lerpPres(x: number, from: 'a' | 'p', to: 'a' | 'p') {
  if (x <= 0) return 0;
  for (let i = 1; i < pres.length; i++) {
    const u = pres[i - 1], v = pres[i];
    if (x <= v[from]) return v[from] === u[from] ? v[to] : u[to] + ((x - u[from]) / (v[from] - u[from])) * (v[to] - u[to]);
  }
  return pres[pres.length - 1][to];
}

/** Film (authored) time to presentation time, and back. */
export const toPresentation = (t: number) => lerpPres(t, 'a', 'p');
export const fromPresentation = (p: number) => lerpPres(p, 'p', 'a');
export const PRESENTATION_LENGTH = pres[pres.length - 1].p;

/** mm:ss of presentation time, for a film time. */
export function formatTime(t: number): string {
  const s = Math.max(0, Math.floor(toPresentation(Math.min(RUNTIME, t))));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export const formatLength = () => {
  const s = Math.round(PRESENTATION_LENGTH);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
