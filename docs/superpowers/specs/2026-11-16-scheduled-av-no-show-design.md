# Scheduled audio/video no-show refund

## Intent

Keep the timed-booking catalogue truthful for scheduled Audio and Video sessions. If a user enters a scheduled room and the Pandit does not join, the server must end the waiting path and return the charged wallet coins using the same refund contract already published by the backend.

## Scope

- Add a server-side waiting watchdog for scheduled Audio and Video rooms.
- Derive the no-show window from the backend booking catalogue.
- Refund and cancel through `BookingsService`, never from browser state.
- Emit the existing format-specific refund/end events so web and mobile recover consistently.
- Refund when the user explicitly ends before the session starts.
- Reconcile scheduled bookings with no connected participant through the database-backed sweep.

## Approaches

- A client-only timeout: rejected because the client cannot be the source of truth for money or booking state.
- A socket-only watchdog: insufficient because no connected participant means no timer is created.
- Socket watchdog plus database reconciliation: chosen because it covers active waiting rooms and abandoned bookings while keeping refund authority in the backend.

## Design

When the first Audio or Video participant joins, the gateway schedules a no-show timeout at the scheduled start plus the catalogue’s no-show window. A second participant cancels that timeout and starts the normal server countdown. If the timeout fires first, the gateway uses `cancelWithRefund`, emits `sessionRefunded` and the format-specific end event, and clears room/timer state. The same refund path is used when a user explicitly ends before the session starts.

`BookingsService` also reconciles confirmed scheduled Audio/Video bookings whose start time is more than the catalogue’s no-show window in the past. It runs at startup and every 60 seconds, calls the same gateway no-show check, and skips `no_timer` bookings so existing legacy terms are preserved. `cancelWithRefund` claims the confirmed row inside the refund transaction, making socket and sweep workers idempotent if they race. A session-ended notification is written after the booking is refunded; notification failure cannot undo the refund or cleanup.

The website and app continue to consume persisted booking duration/price and server events; neither client receives new authority to calculate a refund or extend a session.
