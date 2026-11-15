# iOS UIBackgroundModes for calls — GitHub #66

## Status (verified on `main`)

`apps/mobile/app.json` → `ios.infoPlist.UIBackgroundModes`:

- `audio` — keep native WebRTC audio alive when locked / backgrounded
- `remote-notification` — APNs / silent push readiness (see also #65 / #316)

Mirrored in generated `apps/mobile/ios/PanditTalk/Info.plist`.

**Not** declaring `voip` — that requires PushKit; consultations use the standard WebRTC audio session + `audio` background mode.

## Verify

- Audio/video call → lock screen → remote audio continues (TestFlight binary after prebuild)
- Rebuild native iOS after changing `UIBackgroundModes`
