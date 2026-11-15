# iOS session swipe-back leave confirm — GitHub #61

## Problem

Android `BackHandler` showed “Leave call?” but iOS edge swipe-back could pop the
session stack without confirmation.

## Fix

`hooks/useSessionLeaveGuard.ts` listens for:

- Android `hardwareBackPress`
- React Navigation `beforeRemove` (covers iOS swipe-back / header back)

Mounted in `session/audio.tsx`, `session/video.tsx`, and `session/chat.tsx`.
Programmatic exits (End button, auto-end, errors) call `allowNextRemove()` first.

## Verify

- Active audio/video/chat → swipe from left edge → confirm Stay / Leave
- Leave → WebRTC/socket teardown still runs
- Ended session → back navigates without prompt
