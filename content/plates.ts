// Video plates: the supplied footage, placed on the film clock.
// Footage is atmosphere only. Every fact on screen is drawn by the site.
//
// Each plate maps film time to video time with keyframes `v`, and to
// brightness with keyframes `dim` (the plate fades toward black, which is the
// stage colour). `fi`/`fo` are fade-in/out durations at the plate's ends;
// 0 means a hard cut.

export type ClipId =
  | 'origin' | 'intelligence' | 'systems' | 'real-world'
  | 'map-a' | 'map-b' | 'map-c' | 'map-e';

export type Plate = {
  clip: ClipId;
  t0: number;
  t1: number;
  v: [number, number][];
  dim?: [number, number][];
  fi: number;
  fo: number;
};

export const plates: Plate[] = [
  { clip: 'origin', t0: 0, t1: 8.6, v: [[0, 0], [8.6, 10]], fi: 0, fo: 0.6 },
  { clip: 'intelligence', t0: 8.0, t1: 18.4, v: [[8, 0], [18.4, 11]], dim: [[16.0, 1], [16.5, 0.28]], fi: 0.6, fo: 0.5 },
  { clip: 'systems', t0: 18.0, t1: 28.3, v: [[18, 0], [28, 10]], dim: [[25.6, 1], [26.0, 0.26]], fi: 0.5, fo: 0.5 },
  { clip: 'real-world', t0: 28.0, t1: 39.4, v: [[28, 0], [38, 10]], fi: 0.5, fo: 1.4 },
  // 05 · the night the map went live
  { clip: 'map-a', t0: 42.0, t1: 47.3, v: [[42, 0], [47.3, 10]], fi: 0.8, fo: 0.4 },
  {
    clip: 'map-b', t0: 47.0, t1: 57.0, v: [[47, 0], [52, 10]],
    dim: [[52, 1], [53, 0.16]], fi: 0.4, fo: 0, // hard cut at 4,200
  },
  {
    clip: 'map-c', t0: 58.5, t1: 66.3, v: [[58.5, 3.5], [61, 7], [64, 8.6], [66.3, 10]],
    dim: [[61, 1], [61.6, 0.3], [64, 0.3], [64.4, 0.2]], fi: 0, fo: 0.4,
  },
  { clip: 'map-e', t0: 66.0, t1: 68.3, v: [[66, 0], [68, 8]], fi: 0.3, fo: 0.4 },
];

export const clipOrder: ClipId[] = ['origin', 'intelligence', 'systems', 'real-world', 'map-a', 'map-b', 'map-c', 'map-e'];

/** Piecewise-linear lookup, clamped at both ends. */
export function keyed(keys: [number, number][], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [ta, va] = keys[i - 1], [tb, vb] = keys[i];
    if (t <= tb) return va + ((t - ta) / (tb - ta)) * (vb - va);
  }
  return keys[keys.length - 1][1];
}

export function plateOpacity(p: Plate, t: number): number {
  if (t < p.t0 || t > p.t1) return 0;
  const a = p.fi ? Math.min(1, (t - p.t0) / p.fi) : 1;
  const b = p.fo ? Math.min(1, (p.t1 - t) / p.fo) : t < p.t1 ? 1 : 0;
  return a * b * (p.dim ? keyed(p.dim, t) : 1);
}
