# Bundled media

Virelo does not provide a movie catalogue. All titles, filenames and viewing histories in the landing-page screenshots are synthetic examples.

| Assets in `web/public/` | Provenance |
| --- | --- |
| `favicon-*.png`, `virelo-icon*.png` | Virelo logo supplied by the maintainer, including the transparent version. |
| `landing/coast-cinema.webp`, `landing/night-cinema.webp`, `landing/orbit-cinema.webp` | Original sample artwork generated for this project. Not frames from third-party films. |
| `landing/library-*.webp`, `landing/player-*.webp` | Captures of the actual Virelo UI using an isolated synthetic library and the project-created artwork above. |
| `landing/shorts-original-demo.mp4`, `landing/shorts-original-demo.webp` | Actual Virelo Shorts screen recording and poster, captured with fresh browser storage. The three portrait clips are silent pan/zoom sequences of the project-created artwork above. No downloaded social-media footage or third-party soundtrack is included. |

Third-party fonts, icon libraries and packages retain their own licenses. Their license notices are included with the dependencies; this file does not relicense them.

## Recreate the Shorts demo

Use Node.js 22.16+, FFmpeg/ffprobe, Chromium and an installed Playwright package:

```sh
node scripts/capture-shorts-demo.mjs
```

If Playwright or Chromium is installed outside this project, set `VIRELO_TEST_PLAYWRIGHT` to the absolute Playwright package path and `VIRELO_TEST_CHROMIUM` to the browser executable. `VIRELO_TEST_FFMPEG` and `VIRELO_TEST_FFPROBE` can override the tool paths. The capture script starts a localhost-only Vite instance, uses a new browser context, generates all clips from the three bundled original artworks, and checks the final video format, duration and decoding. Temporary files stay under ignored `node_modules/.cache/shorts-original/`.

## Adding media

Only contribute media that can be redistributed with this repository. Record demonstrations with project-created sample files and fresh browser storage; do not include personal libraries, downloaded social-media clips without permission, account credentials or private local paths. Document the source and any required license notices here.
