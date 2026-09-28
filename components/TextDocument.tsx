import {
  aiStack, certifications, contact, experience, gmailCompose, mapStory, nestiq, person, recognition, resqmesh, skills, softwareStack,
} from '@/content/film';

// The whole film as a plain document: the "Read as text" route and the
// no-JavaScript fallback. Every fact the film shows appears here too.
export function TextDocument({ filmHref }: { filmHref?: string }) {
  return (
    <article className="doc">
      <p className="mono">{person.location} / {person.coordinates}</p>
      <h1>{person.name}</h1>
      <p>{person.roles.join('. ')}. {person.summary}</p>
      <p className="mono">{person.education.degree} / {person.education.school} / {person.education.years}</p>
      {filmHref && <p><a href={filmHref}>Watch the film version</a></p>}

      <h2>Intelligence</h2>
      <p>
        An on-premises retrieval-augmented generation system: {aiStack.pipeline.join(', ')}; a two-tier model
        pair, {aiStack.models.join(' and ')} ({aiStack.quantisation}), served on {aiStack.hardware}; retrieval
        in {aiStack.languages.replaceAll(' / ', ', ')}.
      </p>

      <h2>Systems</h2>
      <p>A request travels {softwareStack.flow.join(', ')}.</p>

      <h2>Experience</h2>
      {experience.map((r) => (
        <section key={r.title + r.org}>
          <h3>{r.title}, {r.org}</h3>
          <p className="mono">{r.dates}</p>
          {r.notes && <ul>{r.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
        </section>
      ))}

      <h2>{mapStory.title}</h2>
      <p>
        During {mapStory.occasion} in {mapStory.city}, the {mapStory.client} needed a web system for {mapStory.purpose.toLowerCase()} that
        could serve {mapStory.requirement.toLocaleString('en-US')} concurrent users. It held {mapStory.held.toLocaleString('en-US')}.
        The platform tracked {mapStory.idols} registered idols across {mapStory.stations} police stations, following each journey
        from {mapStory.journeyStates.map((s) => s.toLowerCase()).join(' to ')}.
      </p>
      <p>Each live update travelled {mapStory.journey.join(', ')}.</p>
      <p>The map wasn’t a visualization. It was the operation.</p>
      <p className="mono">{mapStory.caption}</p>

      <h2>{resqmesh.name}: {resqmesh.tagline}</h2>
      <p>But what happens when the network disappears? {resqmesh.inspiration}, ResQMesh asks what happens to intelligence when connectivity fails.</p>
      <p>{resqmesh.pipeline.join(', ')}. {resqmesh.sop}. {resqmesh.zeroCloud}</p>
      <ul>{[...resqmesh.capabilities, ...resqmesh.mesh].map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="mono">{resqmesh.stack.join(' / ')}</p>
      <p><a href={resqmesh.link}>Project site</a></p>
      <p className="mono">{resqmesh.honesty}</p>

      <h2>{nestiq.name}: {nestiq.tagline}</h2>
      <p>{nestiq.what} {nestiq.why}</p>
      <ul>{nestiq.layers.map((l) => <li key={l}>{l}</li>)}</ul>
      <p className="mono">{nestiq.model} / {nestiq.stack.join(' / ')}</p>
      <p><a href={nestiq.link}>Source</a></p>

      <h2>Skills</h2>
      {skills.map(([k, v]) => <p key={k}><strong>{k}:</strong> {v.join(', ')}</p>)}

      <h2>Certifications and recognition</h2>
      <ul>{[...certifications, ...recognition].map((c) => <li key={c}>{c}</li>)}</ul>

      <h2>Contact</h2>
      <p>Building systems for the real world. Let’s build something difficult.</p>
      <ul>
        <li><a href={contact.github}>GitHub</a></li>
        <li><a href={gmailCompose} target="_blank" rel="noopener">{contact.email}</a></li>
        <li><a href={contact.linkedin}>LinkedIn</a></li>
        {contact.resume && <li><a href={contact.resume} download>Resume (.docx)</a></li>}
      </ul>
    </article>
  );
}
