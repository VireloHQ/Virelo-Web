# Contributing

Keep changes focused, add tests for changed behavior, and search existing issues
and pull requests before opening a change. Discuss large features or stored-data
and API changes first. Update public documentation when behavior changes.

New contributions are licensed under AGPL-3.0-only, as described in [LICENSE](LICENSE). Include any required copyright and license notices for third-party material. This does not change the terms under which earlier contributions were received.

Use stable Node.js 22.23.4+, 24.22.1+ or 26.12.1+ within those release lines.
Run `npm ci` followed by `npm run check` before
opening a pull request. This typechecks and builds the browser app and runs the
unit tests. CI checks the latest patches of Node 22, 24 and 26.

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

`node scripts/audit-browser-streaming.mjs` checks incremental browser conversion
with generated 60-second, dual-audio media. It verifies startup before full-file
conversion, forward/backward seeks, bounded buffering, cancellation and the actual
selected audio frequency. Reported timings describe the test machine, not a
guaranteed latency for every codec or device.

`node scripts/audit-queue.mjs` starts an isolated Vite server with synthetic media
and mocked catalog data. It checks horizontal/vertical scrolling, touch and keyboard
drag sorting, shuffle, repeat, context menus, undo and uninterrupted playback on
desktop and mobile, including reduced motion. It never uses a personal library.
Set `VIRELO_TEST_QUEUE_SCENARIO` to `desktop`, `mobile`, `small` or `reduced`
to run one scenario. Queue edits affect only the current watch session; resetting
or leaving the queue does not change library contents or source media.

See [ASSETS.md](ASSETS.md) for bundled-media sources, credits and capture tools.
Keep credentials, generated audit screenshots, personal media and browser profiles
out of commits. Do not add media without redistribution permission.
Preserve third-party attribution and license notices.

The build output is `dist`. A Git push is not proof of deployment: check the
production host's build result and verify the live asset URLs after every release.
Recreating a Git repository requires reconnecting the hosting integration even
when its URL has not changed.
