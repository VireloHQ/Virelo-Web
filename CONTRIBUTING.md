# Contributing

Keep changes focused, add tests for changed behavior, and search existing issues
and pull requests before opening a change. Discuss large features or stored-data
and API changes first. Update public documentation when behavior changes.

New contributions are licensed under AGPL-3.0-only, as described in [LICENSE](LICENSE). Include any required copyright and license notices for third-party material. This does not change the terms under which earlier contributions were received.

Use Node.js 22.16 or newer. Run `npm ci` followed by `npm run check` before
opening a pull request. This typechecks and builds the browser app and runs the
unit tests. CI checks both Node 22 and 24.

## Browser checks

`scripts/audit-*.mjs` cover landing pages, localization, thumbnails, favorites,
playback controls, responsive layouts and recovery states. Use a separate
Playwright installation and set `VIRELO_TEST_NODE_PACKAGE` to its `package.json`
and `VIRELO_TEST_CHROMIUM` to Chromium as needed. FFmpeg/ffprobe must be on PATH
for generated-media tests.

For example, run `npm run build` and `node scripts/audit-public-locales.mjs`
to check the built landing/setup pages, or `node scripts/audit-favorites.mjs`
for the real app's favorite and queue controls.
Some component audits expect a running Vite server; inspect their URL/environment
options before running them. Use fresh browser storage and synthetic media.

## Assets and deployment

See [ASSETS.md](ASSETS.md) for bundled-media sources, credits and capture tools.
Keep credentials, generated audit screenshots, personal media and browser profiles
out of commits. Do not add media without redistribution permission.
Preserve third-party attribution and license notices.

The build output is `dist`. A Git push is not proof of deployment: check the
production host's build result and verify the live asset URLs after every release.
Recreating a Git repository requires reconnecting the hosting integration even
when its URL has not changed.
