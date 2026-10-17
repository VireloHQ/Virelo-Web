# Player controls and queue audit — 2026-10-07

The npm and browser-only players share grouped viewing tools, themed thin scrollbars, keyboard-accessible video context menus (including fullscreen), explicit off/video/queue repeat modes and a flat queue filmstrip. Queue arrows now browse rather than change playback. Caption clearance follows the measured controls height on narrow screens.

Repeat queue wraps the final item to the first, including a single-item queue. Repeat video stays on the current item without blocking explicit next/previous navigation. The mode remains selected as the queue advances. Existing manual queue behavior remains respected unless repeat queue is explicitly selected.

Validation: browser-only `npm run check` passes typecheck, production build and 32 tests; npm passes its build, typecheck, 63 tests and package dry-run. Browser scripts in the npm repository cover both apps: 78 player/queue assertions and 82 independent-menu assertions, with desktop/mobile screenshot inspection at 1440, 320, 390 and 844px widths.

Audits use generated H.264/AAC footage and isolated browser contexts. Browser-only codec preparation is stubbed: this validates UI and queue/playback state, not actual transcoding or OS-level PiP. Audio/quality conversion algorithms remain unchanged. Both local builds are updated; no version bump or publication is included.
