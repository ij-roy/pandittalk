# iOS touch targets ≥44pt (#69)

## Problem

Header icon slots and session-reminder dismiss used ~28–34pt hit areas, below Apple’s ~44×44pt guidance.

## Fix

- `TabTopHeader` / `WalletCluster`: `HIT_SIZE` 34 → 44
- `SessionReminderBanner`: dismiss 28 → 44; Join Now `minHeight: 44`

## Verify

On a physical phone, tap menu, bell, wallet, and reminder dismiss — should feel easy without precise aiming.
