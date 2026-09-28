import { rng } from '@/lib/anim';

// Procedural map geometry in plate space (a 1600×900 frame matching the
// footage). Positions are artistic, not real locations; counts are exact.

export const MAP_T = {
  counter: 54.5, // first detent step
  step: 0.5,     // film seconds per detent
  cut: 57.0,     // 4,200: the hard cut
  amber: 57.35,  // amber appears after a beat of black
  stations: [64.1, 65.4] as const,
};

const CX = 800, CY = 432;

export function stationPoints(): [number, number][] {
  const r = rng(72);
  const pts: [number, number][] = [];
  for (let i = 0; i < 72; i++) {
    const a = r() * Math.PI * 2;
    const k = 50 + 330 * Math.sqrt(r());
    pts.push([Math.round(CX + Math.cos(a) * k), Math.round(CY + Math.sin(a) * k * 0.92)]);
  }
  // Draw order: from the centre outward, so the network appears to spread.
  return pts.sort((p, q) => Math.hypot(p[0] - CX, p[1] - CY) - Math.hypot(q[0] - CX, q[1] - CY));
}

/** Draws exactly `n` idol points into a canvas covering plate space. */
export function drawIdols(canvas: HTMLCanvasElement, n: number) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d')!;
  const sx = canvas.width / 1600, sy = canvas.height / 900;
  const r = rng(14900);
  ctx.fillStyle = 'rgba(76, 201, 232, 0.55)';
  const s = Math.max(1, 1.3 * dpr);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const k = 420 * Math.pow(r(), 0.72);
    const x = (CX + Math.cos(a) * k) * sx;
    const y = (CY + Math.sin(a) * k * 0.92) * sy;
    ctx.fillRect(x, y, s, s);
  }
}
