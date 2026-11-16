# Scheduled audio/video no-show refund

## Intent

Keep the timed-booking catalogue truthful for scheduled Audio and Video sessions. If a user enters a scheduled room and the Pandit does not join, the server must end the waiting path and return the charged wallet coins using the same refund contract already published by the backend.

## Scope

- Add a server-side waiting watchdog for scheduled Audio and Video rooms.
- Derive the no-show window from the backend booking catalogue.
- Refund and cancel through `BookingsService`, never from browser state.
- Emit the existing format-specific refund/end events so web and mobile recover consistently.
- Refund when the user explicitly ends before the session starts.

Bookings with no participant connected are outside this small change; they remain a candidate for a distributed booking sweeper rather than an in-memory socket timer.

## Approaches

- Client-side timeout: rejected because the client cannot be the source of truth for money or booking state.
- New background sweeper: more complete for abandoned rooms, but adds worker scheduling and deployment scope.
- Socket waiting watchdog: chosen because it fits the existing server timer/event architecture and closes the active waiting path without duplicating booking rules.

## Design

When the first Audio or Video participant joins, the gateway schedules a no-show timeout at the scheduled start plus the catalogue’s no-show window. A second participant cancels that timeout and starts the normal server countdown. If the timeout fires first, the gateway atomically uses `cancelWithRefund`, emits `sessionRefunded` and the format-specific end event, and clears room/timer state. The same refund path is used when a user explicitly ends before the session starts.

The website and app continue to consume persisted booking duration/price and server events; neither client receives new authority to calculate a refund or extend a session.
