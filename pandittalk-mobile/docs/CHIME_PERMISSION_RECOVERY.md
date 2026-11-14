# Chime permission denial recovery — GitHub #297

## Behavior

Before starting audio/video Chime sessions:

1. Request mic (and camera for video) on **iOS** via native `expo-pandit-chime`
   helpers and on **Android** via `PermissionsAndroid`
2. If denied → `MediaPermissionDeniedError`
3. Session screens show **Open Settings** / Not now (then leave session)

## Files

- `modules/expo-pandit-chime/ios/ExpoPanditChimeModule.swift` — `requestMicrophonePermission` / `requestCameraPermission`
- `lib/mediaPermissions.ts` — shared ensure + Settings alert
- `lib/chimeAudio.ts` / `lib/chimeVideo.ts` — call ensure before start
- `app/session/audio.tsx` / `video.tsx` — Settings recovery UI

## Verify

- Deny mic → Open Settings alert → Settings opens
- Grant mic → audio/video session starts normally
- Rebuild iOS native binary after Swift module changes
