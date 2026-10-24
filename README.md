<div align="center">
  <img src="https://raw.githubusercontent.com/VireloHQ/Virelo-Web/main/web/public/virelo-icon-512.png" alt="Virelo" width="128" />
  <h1>Virelo Web</h1>
  <p>Turn a local video folder into a private streaming-style library, entirely in your browser.</p>
</div>

## What it does

Virelo Web runs at [virelo.riyo.me](https://virelo.riyo.me). Choose a folder and the app builds a local library with thumbnails, search, favorites, watch progress, queues, and Shorts.

Video files are read through browser file APIs. They are not copied to Virelo, uploaded to a server, or sent to a third party.

## Features

- Folder selection with the File System Access API and a compatible folder-input fallback.
- Local indexing, thumbnails, favorites, settings, and progress stored in IndexedDB.
- Direct playback from temporary `blob:` URLs.
- Video settings: fit or crop to fill, rotate in 90° steps, and adjust brightness, contrast and saturation without modifying files or changing quality. Adjustments reset for each video and do not apply to native Picture in Picture.
- Selectable embedded audio and text subtitle tracks for Matroska videos.
- Audio and subtitle preferences, including subtitle Off, retained across videos and reloads. Compatible track configurations restore the choice; changed, ambiguous or unsupported tracks use the video's defaults without overwriting preferences.
- Local AC-3/E-AC-3 to AAC audio conversion when the browser cannot decode the selected track.
- Responsive Home, Library, Favorites, Details, Player, and Shorts views.
- Installable PWA shell.
- No accounts, analytics, advertising, metadata providers, or file uploads.

## Browser behavior

The public landing page and setup guide support English, Japanese, Korean and Simplified Chinese. They initially follow the browser's preferred supported language, with English as the fallback. Use the globe button in the header to switch languages; the choice is saved locally and shared across the public pages and tabs. If browser storage is blocked, the choice is retained for the current session. Player/library controls and the recorded demo remain in their existing language.

Folder access requires a secure context, so production must use HTTPS. Browsers that can persist directory handles can reconnect the same folder after permission is granted. The fallback keeps selected files available for the current session and may ask for the folder again after a reload.

Playback support still depends on the video formats and codecs supported by the browser. For Matroska files, Virelo Web can convert selected AC-3/E-AC-3 audio to AAC and extract SRT/SSA/ASS subtitles entirely on the device. It does not upload media or transcode the video stream.

## Development

Use stable Node.js 22.23.4+, 24.22.1+ or 26.12.1+ within those release lines.
These minimums match the CLI and include the
[October 2026 security fixes](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).
The deployed web player itself does not require Node.js on the viewer's device.

```bash
npm ci
npm run dev
```

Run the complete local check with:

```bash
npm run check
```

## Build and deploy

```bash
npm run build
```

Deploy the generated `dist` directory to a static host. No Worker, Pages Function, server process, database binding, or API key is required.

### Cloudflare Pages

Connect `VireloHQ/Virelo-Web` using **Pages Git integration** and use:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | React (Vite) |
| Root directory | Repository root (leave empty), not `web` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js | `22.23.4`, pinned by `.node-version` |

If `NODE_VERSION` is already set in the dashboard, align it with `.node-version`. Do not set the install command to omit development dependencies: TypeScript and Vite are build dependencies. For push-triggered builds, create a Git-integrated Pages project rather than a Direct Upload-only project. See the [Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) and [Node.js version settings](https://developers.cloudflare.com/pages/configuration/build-image/).

Vite copies `_headers`, `_redirects`, and `404.html` from `web/public` to `dist`. Only application routes receive the SPA shell; missing scripts and styles return a real 404. HTML, the manifest, and the service worker revalidate on each load, while hashed `/assets/` files use immutable caching. The CSP permits same-origin LP video, local `blob:` media/workers, and WebAssembly audio codecs without allowing JavaScript `eval` or third-party connections.

To test these host rules locally (Vite preview does not apply them):

```bash
npm run build
npx wrangler pages dev dist
```

Keep the existing host until the Pages preview has passed checks for `/`, `/setup`, `/app`, `/app/settings`, and a direct `/app/watch/<id>` URL. Then attach the existing `virelo.riyo.me` custom domain in Pages. Retaining the same HTTPS origin preserves browser library storage and settings; a `pages.dev` preview has separate browser storage. This repository keeps `vercel.json` for rollback compatibility; it is not used by Pages.

### Deployment verification

After a Git-triggered build succeeds, run `npm run verify:deployment` (or pass
another production URL). This checks the live landing bundle and compares deployed
Hero/Shorts/credit bytes to the repository. A successful push alone does not deploy
a site. When a repository is recreated, reconnect it in the hosting dashboard;
the same repository URL can refer to a different repository ID.

### Workers Builds

The same static build can be hosted with Workers Builds. Reconnect the existing
Worker to the intended repository and production branch, and keep its build
command and static asset directory aligned with `npm run build` and `dist`.

### Recommended headers

```text
Cross-Origin-Opener-Policy: same-origin
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Privacy

See [PRIVACY.md](PRIVACY.md). Browser permission controls remain the source of truth: removing a library clears its Virelo index, while site settings can revoke the browser's underlying folder permission.

## Bundled media

See [ASSETS.md](ASSETS.md) for the provenance of the logo, sample artwork, screenshots and original Shorts recording, and instructions to recreate the demo without private files or third-party footage.

## License

Copyright (c) 2026 Virelo contributors.

The current project is licensed under the [GNU Affero General Public License, version 3 only (AGPL-3.0-only)](LICENSE). Commercial use and sale are permitted under its terms. Distribution requires the corresponding source, and modified versions that users access over a network must offer those users the corresponding source at no charge. Private modifications used only by their author do not need to be published.

Source and build instructions are available in [this repository](https://github.com/VireloHQ/Virelo-Web). When distributing or hosting a modified build, provide the source and build instructions for that exact build and update the app's source link. Your video files and library data are not subject to this source-code requirement.

Permissions for any material previously received under MIT are unchanged. The legacy Virelo MIT notice is preserved in [LICENSES/LEGACY-MIT.txt](LICENSES/LEGACY-MIT.txt); it does not license new changes under MIT. Third-party dependencies and assets retain their own licenses and required notices.

The software is provided without warranty; see [LICENSE](LICENSE) for the full terms.
