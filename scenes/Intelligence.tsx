import { aiStack, experience } from '@/content/film';
import { KeepCase, Scene, Spotlight, Stages } from './parts';

// 02 · Intelligence, 8–18 s. Footage: documents stream into a vector space.
// The retrieval pipeline reads out in place, one stage at a time, while the
// camera flies through it; then the work behind it takes the stage.
export function Intelligence() {
  const role = experience.find((r) => r.scene === 'intelligence')!;
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
      <Spotlight
        tin={16.1}
        tout={18.3}
        title={role.title}
        org={role.org}
        dates={role.dates}
        lines={[
          'Architected an on-premises RAG system for internal government use.',
          'Two-tier Llama 3.1 8B and 3.3 70B, AWQ INT4, served by vLLM on 6 × A100 80GB.',
          'Multilingual retrieval across English, Telugu and Hindi.',
        ]}
      />
    </Scene>
  );
}
