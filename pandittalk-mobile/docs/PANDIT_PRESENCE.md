# Pandit online status expires

Issue #250: `isOnline` stayed true after the pandit left the dashboard, so seekers booked a chat and waited.

## Behavior

- Going online sets `presence_seen_at`
- The pandit dashboard heartbeats that timestamp every 45 seconds while online, and again when the tab becomes visible
- Public lists, profiles, chat-now, and the queue treat a pandit as online only if the flag is on and the heartbeat is under 2 minutes old
- The mobile experts list and profile refresh that status while the screen is open
- Chat now checks the profile again before charging

Tracks #250.
