import { resqmesh } from '@/content/film';
import { rng } from '@/lib/anim';
import { cue, KeepCase, Letters, Pin, Scene } from './parts';

// 06 · ResQMesh, 70–78 s. No footage: terrain, links and incidents are drawn
// here, in plate space (1600×900). All incidents are demonstration data.

const NODE: [number, number] = [800, 450];

function terrain() {
  const r = rng(19);
  const rings: string[] = [];
  const centres: [number, number][] = [[470, 470], [1080, 330], [860, 640], [260, 250], [1350, 700]];
  for (const [cx, cy] of centres) {
    const p1 = r() * 6, p2 = r() * 6;
    for (let i = 1; i <= 8; i++) {
      const base = i * 34;
      let d = '';
      for (let k = 0; k <= 64; k++) {
        const a = (k / 64) * Math.PI * 2;
        const rad = base * (1 + 0.16 * Math.sin(3 * a + p1) + 0.08 * Math.sin(5 * a + p2));
        d += `${k ? 'L' : 'M'}${(cx + Math.cos(a) * rad * 1.35).toFixed(1)} ${(cy + Math.sin(a) * rad * 0.78).toFixed(1)}`;
      }
      rings.push(d + 'Z');
    }
  }
  return rings;
}

function incidents(): [number, number][] {
  const r = rng(404);
  const pts: [number, number][] = [];
  while (pts.length < 18) {
    const p: [number, number] = [220 + r() * 1160, 180 + r() * 560];
    if (Math.hypot(p[0] - NODE[0], p[1] - NODE[1]) > 90 && pts.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) > 70)) pts.push(p);
  }
  return pts;
}

function mesh(pts: [number, number][]) {
  const lines: [number, number, number, number][] = [];
  pts.forEach((p, i) => {
    for (let j = i + 1; j < pts.length; j++) {
      if (Math.hypot(p[0] - pts[j][0], p[1] - pts[j][1]) < 260) lines.push([p[0], p[1], pts[j][0], pts[j][1]]);
    }
    if (Math.hypot(p[0] - NODE[0], p[1] - NODE[1]) < 330) lines.push([NODE[0], NODE[1], p[0], p[1]]);
  });
  return lines;
}

export function ResQMesh() {
  const rings = terrain();
  const pts = incidents();
  const links = mesh(pts);
  // Five capabilities, pinned to five incidents spread across the frame.
  const capAt = [2, 7, 11, 4, 15].map((i) => pts[i]);
  return (
    <Scene id="resqmesh" tin={70.1} tout={78.3} label={`${resqmesh.name}: ${resqmesh.tagline}`}>
      {/* the bridge */}
      <div className="bridge">
        <p className="statement" {...cue(70.3, 71.9, 'wipe', { d: 0.5 })}>But what happens</p>
        <p className="statement" {...cue(70.7, 71.9, 'wipe', { d: 0.5 })}>when the network</p>
        <p className="statement" {...cue(71.1, 71.9, 'wipe', { d: 0.5 })}>disappears?</p>
      </div>

      <div className="plate-space">
        <svg className="terrain" viewBox="0 0 1600 900" aria-hidden="true">
          <g className="contours" {...cue(72.0, 78.1, 'fade', { d: 0.9, do: 0.5 })}>
            {rings.map((d, i) => <path key={i} d={d} />)}
          </g>
          <g className="uplinks">
            {pts.map(([x, y], i) => (
              <path key={i} d={`M${x} ${y}L${800 + (x - 800) * 0.25} -20`} {...cue(72.1, 72.95 + i * 0.03, 'fade', { d: 0.4, do: 0.18 })} />
            ))}
          </g>
          <g className="candidates" {...cue(72.2, 74.5, 'fade', { d: 0.5 })}>
            {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} />)}
          </g>
          <g className="links">
            {links.map(([a, b, c, d], i) => (
              <path key={i} d={`M${a} ${b}L${c} ${d}`} pathLength={1} {...cue(75.0 + (i % 12) * 0.08, 77.7, 'draw', { d: 0.5 })} />
            ))}
          </g>
          <g className="incidents">
            {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4.5} {...cue(74.4 + i * 0.05, 77.7, 'fade', { d: 0.3 })} />)}
          </g>
          <circle className="node-ring" cx={NODE[0]} cy={NODE[1]} r={22} {...cue(73.0, 77.8, 'fade', { d: 0.6 })} />
        </svg>
        {capAt.map(([x, y], i) => (
          <Pin key={i} x={x / 1600} y={y / 900} tin={75.6 + i * 0.3} tout={77.7} label={resqmesh.capabilities[i]} left={x > 1150} drift={0} />
        ))}
      </div>

      <div className="lower-left">
        <p className="statement" {...cue(72.3, 73.9, 'wipe', { d: 0.6 })}>One system keeps the city visible.</p>
        <p className="statement dim" {...cue(72.95, 73.9, 'wipe', { d: 0.6 })}>Another asks what happens when the city becomes invisible.</p>
      </div>
      <p className="telemetry telemetry--tr mono" {...cue(73.2, 74.4)}>
        <span>Uplink lost</span>
        <b>Local node remains</b>
      </p>
      <p className="telemetry telemetry--tl mono" {...cue(72.3, 77.8, 'fade', { d: 0.6 })}>
        <b>{resqmesh.inspiration}</b>
        <span className="micro">{resqmesh.honesty}</span>
      </p>

      <div className="resq-title">
        <h2 className="title-l" {...cue(74.0, 77.8, 'track', { d: 0.9 })}><Letters text={resqmesh.name.toUpperCase()} /></h2>
        <p className="mono signal" {...cue(74.5, 77.8, 'wipe', { d: 0.6 })}>{resqmesh.tagline}</p>
      </div>

      <div className="telemetry telemetry--tr resq-spec mono" {...cue(75.2, 77.8, 'fade', { d: 0.5 })}>
        {resqmesh.mesh.map((m) => <span key={m}><KeepCase text={m} /></span>)}
        <b>{resqmesh.stack.join(' / ')}</b>
        <span className="micro">{resqmesh.zeroCloud}</span>
        <a className="spec-link" href={resqmesh.link} target="_blank" rel="noopener">Project site</a>
      </div>

      <ol className="flow flow--phone flow--high mono" aria-hidden="true" {...cue(75.6, 77.7, 'none')}>
        {resqmesh.capabilities.map((c, i) => <li key={c} {...cue(75.6 + i * 0.3, 77.7, 'fade', { d: 0.3 })}>{c}</li>)}
      </ol>

      <ol className="flow mono" aria-label="ResQMesh pipeline" {...cue(75.9, 77.8, 'none')}>
        {resqmesh.pipeline.map((n, i) => <li key={n} {...cue(76.0 + i * 0.22, 77.8, 'fade', { d: 0.25 })}>{n}</li>)}
      </ol>
      <p className="caption mono" {...cue(74.4, 77.8)}>{resqmesh.demoCaption}</p>
    </Scene>
  );
}
