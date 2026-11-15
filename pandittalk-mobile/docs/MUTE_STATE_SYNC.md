# Mute button matches the call

Issue #242: the mic icon flipped even when the media adapter rejected the mute change.

`setMuted` now returns whether the local WebRTC stream exists. Audio and video only update the icon when that is true. A missing stream returns false, so the button stays on the last real state.

Tracks #242.
