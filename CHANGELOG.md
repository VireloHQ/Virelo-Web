# Changelog

## Unreleased

- Apply volume leveling before audible output with a 30ms native-audio lookahead and an audio-rate detector, including startup and seeks. Bind processing before playback effects, preserve manual volume and mute, and remove the delayed main-thread polling loop without modifying source files.

- Animate pointer-driven settings selection with a shared moving highlight and a short, position-stable panel fade; keep keyboard and reduced-motion navigation immediate. Add share/playlist action icons, align video action heights, and shorten nonessential helper copy.

- Restore the startup splash with a brief visible logo/wordmark hold before the shared fade. Start timing only when the screen is visible, wait briefly for the logo without blocking startup indefinitely, and honor reduced motion.

- Align the settings selection rail with the full highlighted row and use neutral selected and keyboard-focus states consistently with the npm app.

- Leave the share-QR logo and its surrounding central area free of QR modules, including transparent parts of the logo, in both the preview and PNG download.

- Add rounded share QR modules/finder corners, a centered Virelo logo and a self-contained PNG download. Move sharing out of the header into labelled video actions and Sharing settings; enlarge remaining header icons to 28px with 48px touch targets.

- Add a locally generated app link/QR in the header without transferring local videos, playlists or file handles. Lazy-load the QR generator and include its MIT notice.
- Add opt-in live volume leveling for normal videos, Shorts and selected audio. Save the device preference, bound gain, ignore silence, preserve manual volume/mute and avoid pre-scanning, rewriting or uploading files. Describe this as live stereo leveling, not whole-file integrated LUFS normalization.

- Prevent duplicate folder registrations using directory-handle identity, including saved and session-only handles. Serialize add/reconnect/remove operations across tabs when Web Locks are available, preserve existing IDs and personal state, reject reconnects to another registered folder, and direct ambiguous same-name fallback selections to Reconnect without merging their data.

- Play AVI videos locally in the browser using a lazily loaded, self-hosted FFmpeg WebAssembly decoder. Generate read-only-input thumbnails and bounded playback segments, keep original resolution by default, and support seeking, audio selection, quality changes and resume without uploading or modifying source files. Document browser limits and include decoder licenses and source links.

- Keep the first touch on a hidden normal-player overlay reveal-only, without pausing playback, and restart its idle timer. Clear the pending touch intent when a gesture is cancelled.

- Replace the stacked mobile player panel with centered playback controls, top-edge tools and a 44px bottom seek strip over a light edge gradient. Keep title details below the inline video, retain the fullscreen title, fit landscape playback above navigation, and leave repeat in Settings and shuffle in the Queue or fullscreen without duplicating them over the inline picture.

- Make the Library's Playlists entry a filled, bordered navigation button with a list icon, direction arrow and 44px touch target. Keep it visible and usable beside sorting controls on mobile, with keyboard focus and normal link behavior.

- Use the full detail-page text column for titles, with natural wrapping and matching loading placeholders. Keep compact queue drag previews aligned with the pointer in both layouts. Reveal header search beside a fixed toggle, preserve immediate keyboard operation, and replace purple playlist-field frames with a neutral keyboard-focus underline.

- Replace the normal player's toolbar with a translucent media-control panel, title and remaining-time display, circular play/pause, 10-second rewind and 30-second forward. Keep shuffle, previous, next and repeat in a stable order, synchronize queue controls, and expose volume and Picture in Picture outside the ellipsis Settings menu.
- Add device-local 0.25–2× playback speeds with pitch preservation and matching converted-audio rates. Animate pointer-driven Settings and submenu changes, separate options from header dividers, fade idle controls downward, and keep keyboard/reduced-motion operation immediate. Correct recovery-message text contrast in the Web app.

- Add persistent named playlists with creation, renaming, ordered playback, shuffle, queue saving, video additions, drag/keyboard sorting, removal, undo and confirmed deletion. Keep playlists private to each npm account or local to the Web browser, preserve unavailable references and reject conflicting edits without modifying source files.

- Start browser quality/audio playback incrementally from the current position instead of converting the entire file first. Remux compatible AAC, bound conversion and buffering, cancel superseded work, preserve the latest audio selection across seeks, and avoid re-encoding video for audio-only changes.

- Add editable horizontal and vertical playback queues, including a desktop side panel, touch/keyboard drag sorting, shuffle, repeat toggling, play-next, queue-only removal, undo and reset. Save layout preferences on each device and keep current playback stable during edits and refreshes. Remove competing scroll snapping and load queues beyond 500 videos.

- Complete confirmation-dialog exits through the overlay lifecycle, including interrupted transitions. Read motion durations in milliseconds or seconds so production CSS minification preserves startup timing.

- Consolidate normal-player quality, audio, subtitles, picture adjustments and repeat into Settings. Keep the mobile transport together, remove the redundant Back button and matching loading gap, and label Shorts audio/subtitle controls.

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
