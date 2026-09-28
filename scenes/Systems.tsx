import { experience, softwareStack } from '@/content/film';
import { cue, Scene, Spotlight, Stages } from './parts';

// 03 · Systems, 18–28 s. Footage: a request beam enters compute towers, flows
// through modules, and resolves into a network mesh. The request's path
// reads out in place; the mesh becomes the word; then the work behind it
// takes the stage.
export function Systems() {
  const [meta, aws] = experience.filter((r) => r.scene === 'systems');
  return (
    <Scene id="systems" tin={18.1} tout={28.3} label="Systems">
      <Stages
        label="Request path"
        tin={18.5}
        step={1.2}
        tout={24.4}
        items={[
          { name: softwareStack.flow[0], sub: softwareStack.flow[1] },
          { name: softwareStack.flow[2], sub: softwareStack.flow[3] },
          { name: softwareStack.flow[4] },
          { name: softwareStack.flow[5], sub: softwareStack.flow[6] },
          { name: softwareStack.flow[7], sub: 'Response' },
        ]}
      />
      <h2 className="systems-word" {...cue(24.5, 25.8, 'width', { d: 0.5, do: 0.3 })}>Systems</h2>
      <Spotlight
        tin={25.8}
        tout={27.2}
        title={meta.title}
        org={meta.org}
        dates={meta.dates}
        lines={[
          '20+ secure REST APIs with OAuth2, in Django and Flask.',
          'Database performance and storage efficiency improved by 40%.',
          '7+ workflows automated with webhooks and integrations.',
        ]}
      />
      <Spotlight
        tin={27.2}
        tout={27.98}
        title={aws.title}
        org={aws.org}
        dates={aws.dates}
        lines={['Cloud Architecting and Cloud Foundations certifications.']}
      />
    </Scene>
  );
}
