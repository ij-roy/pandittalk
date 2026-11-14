# Offline banner

Issue #205. A single banner sits above every screen when the device reports no connection or no reachable internet. Unknown readings stay hidden so a slow first check does not flash the banner.

The check uses `expo-network` (`getNetworkStateAsync` and `addNetworkStateListener`). The native module is included on the next dev-client or store build. If that binary is older than this change, the banner stays hidden instead of crashing.

Per-screen request errors are unchanged. This banner is the shared signal that those failures are because the device is offline.
