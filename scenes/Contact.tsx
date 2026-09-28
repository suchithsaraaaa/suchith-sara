import { contact, gmailCompose, person, recognition, skills } from '@/content/film';
import { cue, Letters, Scene } from './parts';

// 08 · Contact, 84–90 s. The film rests here.
export function Contact() {
  const links: { label: string; href: string | null }[] = [
    { label: 'GitHub', href: contact.github },
    { label: 'Email', href: gmailCompose },
    { label: 'LinkedIn', href: contact.linkedin },
    { label: 'Resume', href: contact.resume },
  ];
  return (
    <Scene id="contact" tin={84.0} tout={999} label="Contact">
      <div className="contact">
        <h2 className="contact-name" {...cue(85.0, undefined, 'track', { d: 1.0 })}><Letters text={person.name.toUpperCase()} /></h2>
        <p className="contact-line" {...cue(85.8, undefined, 'wipe', { d: 0.8 })}>Building systems<br />for the real world.</p>
        <p className="contact-invite" {...cue(86.6, undefined, 'rise', { d: 0.6 })}>
          Let’s build something difficult.<span className="cursor" aria-hidden="true" />
        </p>
      </div>
      {/* Key skills, drifting past on the right: text only, a CSS loop, still for reduced motion. */}
      <div className="skills-reel" aria-label="Key skills" {...cue(86.2, undefined, 'fade', { d: 1.2 })}>
        <div className="skills-track">
          {[0, 1].map((copy) => (
            <div className="skills-set" key={copy} aria-hidden={copy === 1 || undefined}>
              {skills.map(([group, items]) => (
                <section key={group} className="skills-group">
                  <h3 className="mono">{group}</h3>
                  <ul>{items.map((s) => <li key={s}>{s}</li>)}</ul>
                </section>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="recognition mono" {...cue(87.4, undefined, 'fade', { d: 0.5 })}>{recognition.join(' / ')}</p>
      <nav className="contact-links mono" aria-label="Contact">
        {links.map((l, i) =>
          l.href ? (
            <a key={l.label} href={l.href} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : l.href.endsWith('.docx') ? { download: '' } : {})} {...cue(87.1 + i * 0.1, undefined, 'rise', { d: 0.4 })}>{l.label}</a>
          ) : (
            <span key={l.label} className="is-pending" aria-disabled="true" title="Available soon" {...cue(87.1 + i * 0.1, undefined, 'rise', { d: 0.4 })}>{l.label}</span>
          ),
        )}
      </nav>
      <button type="button" className="replay mono" data-replay {...cue(87.6, undefined, 'rise', { d: 0.4 })}>Replay from 00:00</button>
    </Scene>
  );
}
