import { aiStack, experience } from '@/content/film';
import { Chapter, cue, KeepCase, Scene, Stages } from './parts';

// 02 · Intelligence, 8–18 s. Footage: documents stream into a vector space.
// The retrieval pipeline reads out in place, one stage at a time, while the
// camera flies through it; then the scene names itself.
export function Intelligence() {
  const intern = experience.find((r) => r.scene === 'intelligence')!;
  return (
    <Scene id="intelligence" tin={8.6} tout={18.3} label="Intelligence">
      <Stages
        label="Retrieval pipeline"
        tin={9.2}
        step={1.7}
        tout={16.0}
        items={[
          { name: `${aiStack.pipeline[0]} to ${aiStack.pipeline[1]}`, sub: aiStack.languages },
          { name: aiStack.pipeline[3], sub: 'Vector retrieval' },
          { name: `${aiStack.models[0]} / ${aiStack.models[1].replace('Llama ', '')}`, sub: <><KeepCase text={aiStack.pipeline[4]} /> / {aiStack.quantisation}</> },
          { name: aiStack.hardware, sub: aiStack.deployment },
        ]}
      />
      <h2 className="title-l title-l--low" {...cue(16.3, 18.2, 'wipe', { d: 1.0, do: 0.6 })}>AI systems</h2>
      <div className="chapters">
        <Chapter tin={15.8} tout={18.2} title={intern.title} org={intern.org} dates={intern.dates} />
      </div>
    </Scene>
  );
}
