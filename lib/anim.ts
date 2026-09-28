// Small pure helpers for time-driven choreography. Everything is a function of
// film time, never of elapsed wall time, so any frame can be reproduced.

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);

/** 0 before t0, 1 after t1, linear between. */
export const range = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));

/** Motion token "settle": cubic-bezier(.16, 1, .3, 1) approximated by an expo-out. */
export const settle = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

export const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export const mix = (a: number, b: number, x: number) => a + (b - a) * x;

/** Writes a style property only when it changed, to avoid redundant style work. */
export function setStyle(el: HTMLElement | null, prop: string, value: string) {
  if (!el) return;
  const cache = ((el as HTMLElement & { __s?: Record<string, string> }).__s ??= {});
  if (cache[prop] === value) return;
  cache[prop] = value;
  el.style.setProperty(prop, value);
}

/** Deterministic PRNG (LCG), so procedural geometry is identical on every load. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
