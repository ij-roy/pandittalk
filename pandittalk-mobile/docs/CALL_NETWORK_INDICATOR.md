# Call connection indicator

Issue #243: a choppy call looked like the pandit's fault.

Audio and video calls listen to WebRTC connection state and show:

- Your connection is good
- Your connection is weak — your network, not the pandit
- Your connection dropped — your network, not the pandit

The banner stays hidden until WebRTC reports a connection state, and it hides again when the call media stops.

Tracks #243.
