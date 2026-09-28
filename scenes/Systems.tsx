import { experience, softwareStack } from '@/content/film';
import { Chapter, cue, Scene, Stages } from './parts';

// 03 · Systems, 18–28 s. Footage: a request beam enters compute towers, flows
// through modules, and resolves into a network mesh. The request's path
// reads out in place as it travels; then the mesh becomes the word.

// Short forms of the resume's figures, for the chapter marks.
const NOTES = ['20+ REST APIs / OAuth2 / DB performance +40%', 'Cloud Architecting / Cloud Foundations'];

export function Systems() {
  const roles = experience.filter((r) => r.scene === 'systems');
  return (
    <Scene id="systems" tin={18.1} tout={28.3} label="Systems">
      <Stages
        label="Request path"
        tin={18.5}
        step={1.4}
        tout={25.6}
        items={[
          { name: softwareStack.flow[0], sub: softwareStack.flow[1] },
          { name: softwareStack.flow[2], sub: softwareStack.flow[3] },
          { name: softwareStack.flow[4] },
          { name: softwareStack.flow[5], sub: softwareStack.flow[6] },
          { name: softwareStack.flow[7], sub: 'Response' },
        ]}
      />
      <h2 className="systems-word" {...cue(25.9, 28.2, 'width', { d: 1.6, do: 0.6 })}>Systems</h2>
      <div className="chapters">
        {roles.map((r, i) => (
          <Chapter key={r.org} tin={22.6 + i * 0.9} tout={27.8} title={r.title} org={r.org} dates={r.dates} note={NOTES[i]} />
        ))}
      </div>
    </Scene>
  );
}
