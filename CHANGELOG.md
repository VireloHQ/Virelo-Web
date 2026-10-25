# Changelog

## Unreleased

- Start browser quality/audio playback incrementally from the current position instead of converting the entire file first. Remux compatible AAC, bound conversion and buffering, cancel superseded work, preserve the latest audio selection across seeks, and avoid re-encoding video for audio-only changes.

- Add editable horizontal and vertical playback queues, including a desktop side panel, touch/keyboard drag sorting, shuffle, repeat toggling, play-next, queue-only removal, undo and reset. Save layout preferences on each device and keep current playback stable during edits and refreshes. Remove competing scroll snapping and load queues beyond 500 videos.

- Complete confirmation-dialog exits through the overlay lifecycle, including interrupted transitions. Read motion durations in milliseconds or seconds so production CSS minification preserves startup timing.

- Consolidate normal-player quality, audio, subtitles, picture adjustments, repeat and PiP into Settings. Keep mobile transport on one row, remove the redundant Back button and matching loading gap, and label Shorts audio/subtitle controls.

- Unify app motion with 160–250ms feedback, restrained fades and small surface scales. Keep page text and search layout stationary, use reversible dialog/dropdown transitions, and preserve immediate keyboard operation and reduced-motion preferences.

- Add a visible eight-ray spark burst when saving a favorite from Shorts, the video player or title details. Keep playback and button layout stable, cancel interrupted effects, and use a gentle fade for reduced motion.

- Localize the landing page, setup guide, demo controls and accessibility labels into English, Japanese, Korean and Simplified Chinese. Add a custom header language selector, browser-language detection, persistent local selection and cross-tab synchronization. Keep public metadata and FAQ markup in sync without changing the Virelo page title or translating executable commands.

- Open context menus beside the pointer, with edge-aware left/right placement and side-facing bubble tails. Open Video settings beside its context-menu row as a nested panel, preserving the parent menu and keyboard/focus behavior.

- Add a dedicated Video settings bubble with aspect-preserving fit/fill, 90° rotation and brightness, contrast and saturation sliders. Apply changes without reloading playback or modifying files, reset them for each video, and keep subtitles and controls unaffected. Native Picture in Picture retains the original view.

- Group player viewing controls, theme scrollbars, and add keyboard-accessible video context menus that work in fullscreen.
- Add explicit repeat-off, repeat-video and repeat-queue modes, retaining the choice between queued videos and supporting single-item queues.
- Replace framed queue cards with a compact filmstrip; scroll its rail with arrows, wheel, touch and keyboard without changing playback. Keep captions above wrapping controls on narrow screens.

- Added selectable embedded audio and subtitle tracks in the video player.
- Added private, in-browser AC-3/E-AC-3 to AAC conversion for incompatible audio.
- Kept switched audio tracks aligned with the video timeline and reliably resumed playback after preparation.
- Added smooth mouse-wheel navigation to overflowing library and folder chip rows.
- Kept hover previews at the card's original size and removed redundant preview controls.
- Added manual lower-resolution playback for local files, with original quality selected by default and no network Auto mode.

- Initial browser-only Virelo Web application.
- Local folder selection without file uploads.
- IndexedDB library index, thumbnails, favorites, settings, and watch progress.
- Direct local playback, responsive library views, Shorts, and PWA support.
