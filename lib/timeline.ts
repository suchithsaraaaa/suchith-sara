import { RUNTIME, scenes, type Scene } from '@/content/film';

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

export function formatTime(t: number): string {
  const s = Math.max(0, Math.min(RUNTIME, Math.floor(t)));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
