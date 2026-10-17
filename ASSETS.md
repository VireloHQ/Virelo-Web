# Bundled media

Virelo does not provide a movie catalogue. The library and player screenshots use synthetic titles, filenames and viewing histories. The Shorts demonstration uses licensed Blender film excerpts, not a catalogue included with the player.

| Assets in `web/public/` | Provenance |
| --- | --- |
| `favicon-*.png`, `virelo-icon*.png` | Virelo logo supplied by the maintainer, including the transparent version. |
| `landing/coast-cinema.webp`, `landing/night-cinema.webp`, `landing/orbit-cinema.webp` | Original sample artwork generated for this project. Not frames from third-party films. |
| `landing/library-*.webp`, `landing/player-*.webp` | Captures of the actual Virelo UI using an isolated synthetic library and the project-created artwork above. |
| `landing/shorts-blender-demo.mp4`, `landing/shorts-blender-demo.webp` | Actual Virelo Shorts screen recording and poster, captured with fresh browser storage. The three portrait clips are cropped, silent excerpts from Big Buck Bunny and Sintel, by Blender Foundation, licensed under CC BY 3.0. No downloaded social-media footage or third-party soundtrack is included. |
| `landing/shorts-blender-credits.txt` | Attribution, source URLs, edits and license links for the Shorts recording and poster. Linked visibly below the phone mockup and included in built output. |

Third-party footage, fonts, icon libraries and packages retain their own licenses; they are not relicensed as AGPL. Font and package license notices are included with the dependencies.

## Blender excerpt credits

- **Big Buck Bunny** — © copyright 2008, Blender Foundation / www.bigbuckbunny.org. [Official attribution requirements](https://peach.blender.org/about/). [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- **Sintel** — © copyright Blender Foundation | durian.blender.org. [Official attribution requirements](https://durian.blender.org/sharing/). [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

The film excerpts and their poster frames are cut, cropped to portrait, resized and muted. Two Sintel excerpts and one Big Buck Bunny excerpt are displayed inside the actual Virelo UI. No complete film is redistributed. The licensors do not endorse Virelo. Complete source and edit details are in `web/public/landing/shorts-blender-credits.txt`.

## Recreate the Shorts demo

Use Node.js 22.16+, FFmpeg/ffprobe, Chromium and an installed Playwright package:

```sh
node scripts/capture-shorts-demo.mjs
```

Set `VIRELO_DEMO_MEDIA_DIR` to the folder containing the verified, silent 18-second working excerpts `sintel.mp4` and `bunny.mp4`, reused from the Virelo launch-video project. The default is ignored `node_modules/.cache/shorts-blender/sources/`. These working files are not bundled in the repository. The script verifies their SHA-256 hashes before recording:

| File | SHA-256 |
| --- | --- |
| `sintel.mp4` | `151f543969ebd4643aa0cde14e000d8d0559586f1e9ad693d427cf4179e4c8e2` |
| `bunny.mp4` | `9695b70ed5e4ae939b230dd50422ce5aed24bcc49c0e37c02f2e51365c60d1d7` |

For new source encodes, follow the source/offset details in the bundled credits, review the decoded footage and update these hashes and the script together. Do not substitute unverified files or a different soundtrack.

If Playwright or Chromium is installed outside this project, set `VIRELO_TEST_PLAYWRIGHT` to the absolute Playwright package path and `VIRELO_TEST_CHROMIUM` to the browser executable. `VIRELO_TEST_FFMPEG` and `VIRELO_TEST_FFPROBE` can override the tool paths. The capture script starts a localhost-only Vite instance, uses fresh browser storage, verifies that all three clips appear, and checks the final video format, duration and decoding. Temporary files stay under ignored `node_modules/.cache/shorts-blender/`.

## Adding media

Only contribute media that can be redistributed with this repository. Record demonstrations with project-created or explicitly licensed sample files and fresh browser storage; do not include personal libraries, downloaded social-media clips without permission, account credentials or private local paths. Document the source and any required license notices here.
