# Footage

The film uses eight supplied 4K clips. `scripts/encode-media.sh` turns the masters into web plates in `public/media/`:

| Clip id | Master | Used for |
|---|---|---|
| origin | scene1.mp4 | 01 Origin |
| intelligence | scene2.mp4, from 9 s | 02 Intelligence |
| systems | scene3.mp4 | 03 Systems |
| real-world | scene4.mp4 | 04 Real world |
| map-a | scene 5a.mp4 | 05 The point becomes a city |
| map-b | scene5b.mp4 | 05 Routes form; held and dimmed under the counter |
| map-c | scene 5c.mp4 | 05 The city keeps moving, the journey, the stations |
| map-e | scene 5e.mp4 | 05 One live system |

ResQMesh, NestIQ and Contact have no footage; they are drawn in code.

Where each clip sits on the film clock (video time against film time, dimming, fades) is in `content/plates.ts`.

## Re-encoding

```bash
bash scripts/encode-media.sh "/path/to/masters"
```

For each clip the script writes:

- `-16x9.mp4`: 1600 px wide, keyframe every 6 frames so backward scrubbing stays fast, light denoise.
- `-9x16.mp4`: 720×1280 centre crop for phones.
- A first-frame poster and a still for reduced motion.
- An `.m4a` ambience bed for the optional sound.

## Rules for any new clip

- Atmosphere only: no text, numbers, logos, uniforms or faces. The site draws every fact.
- Near-black frames, cool key light, restrained cyan.
- 4–10 seconds, with the camera settling into stillness at the end.
