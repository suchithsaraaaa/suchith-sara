import { experience, softwareStack } from '@/content/film';
import { Chapter, cue, Pin, Scene } from './parts';

// 03 · Systems, 18–28 s. Footage: a request beam enters compute towers, flows
// through modules, and resolves into a network mesh. The request's path
// builds along the bottom as it travels; then the mesh becomes the word.
const PINS: [number, number, number, string][] = [
  [0.1, 0.5, 18.5, 'Request'],
  [0.27, 0.3, 19.4, 'REST API'],
  [0.5, 0.26, 20.3, 'Django / Flask'],
  [0.42, 0.72, 21.0, 'Python'],
  [0.8, 0.3, 21.7, 'PostgreSQL'],
  [0.34, 0.6, 22.8, 'Queue / worker'],
  [0.72, 0.74, 23.8, 'AWS'],
  [0.6, 0.48, 24.8, 'React / Next.js'],
];

// Short forms of the resume's figures, for the chapter marks.
const NOTES = ['20+ REST APIs / OAuth2 / DB performance +40%', 'Cloud Architecting / Cloud Foundations'];

export function Systems() {
  const roles = experience.filter((r) => r.scene === 'systems');
  return (
    <Scene id="systems" tin={18.1} tout={28.3} label="Systems">
      <div className="plate-space">
        {PINS.map(([x, y, tin, label]) => (
          <Pin key={label} x={x} y={y} tin={tin} tout={25.8} label={label} left={x < 0.3} />
        ))}
      </div>
      <ol className="flow mono" aria-label="Request path" {...cue(18.4, 27.7, 'none')}>
        {softwareStack.flow.map((node, i) => (
          <li key={node} {...cue(18.5 + i * 0.95, 27.7, 'fade', { d: 0.3 })}>{node}</li>
        ))}
      </ol>
      <h2 className="systems-word" {...cue(25.9, 28.2, 'width', { d: 1.4, do: 0.5 })}>Systems</h2>
      <div className="chapters">
        {roles.map((r, i) => (
          <Chapter key={r.org} tin={22.6 + i * 0.8} tout={27.8} title={r.title} org={r.org} dates={r.dates} note={NOTES[i]} />
        ))}
      </div>
    </Scene>
  );
}
