# Suchith Sara, a film you scroll

A 90-second, eight-scene film of Suchith Sara's engineering work, played by native scroll. Next.js static export, no server.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static site in out/
```

## Where things live

- `content/film.ts`: every fact the film states, plus the scene table (film time and scroll weight).
- `content/plates.ts`: where each video clip sits on the film clock.
- `lib/clock.ts`: film time from scroll, from Play (wall time), or from the self-playing opening.
- `lib/cues.ts`: scene markup carries `data-in` / `data-out` / `data-fx`, and one renderer animates it all.
- `lib/plates.ts`: two video elements. Moving forward, the video plays natively with its speed chasing the film; only backward motion seeks.
- `lib/sound.ts`: optional ambience (off until the visitor turns it on).
- `scenes/`: one file per scene.
- `/text/`: the same content as a plain document, which is also the no-JavaScript fallback.

## Keys

Space (or K) plays and pauses the 90-second film. The arrow keys step one beat. 1–8 jump to scenes. M toggles sound. Home and End go to the ends. Scrolling during playback pauses it and hands control back to scroll.

## Settings

`NEXT_PUBLIC_RESUME_URL` overrides the resume link. It defaults to the resume linked from the GitHub profile.

Footage notes are in `docs/MEDIA.md`.
