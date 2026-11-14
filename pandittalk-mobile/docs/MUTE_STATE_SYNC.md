# Mute button matches the call

Issue #242: the mic icon flipped even when Chime rejected the mute change.

`setMuted` now returns whether `realtimeLocalMute` / `realtimeLocalUnmute` succeeded. Audio and video only update the icon when that is true. A missing meeting returns false, so the button stays on the last real state.

Tracks #242.
