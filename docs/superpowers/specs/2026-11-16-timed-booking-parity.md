# Timed Booking Parity Specification

## Goal

Make the website offer the same timed scheduled consultations and Chat Now service as the mobile app, using the live booking backend as the source of truth for catalog rules, quotes, availability, wallet balance, booking creation, session timers, cancellations, and refunds.

## Confirmed current rules

- Scheduled sessions use the existing `legacy_timed` model. New `no_timer` creation remains rejected by the backend and must not be advertised by the website.
- Scheduled depths are Entry (15 minutes, 151 coins), Standard (25 minutes, 301 coins), and Deep (45 minutes, 501 coins).
- Scheduled formats are audio (no surcharge), video (+150 coins), and chat (-50 coins from the depth price). The website must display the returned backend quote instead of reproducing these numbers in UI code.
- Scheduled booking charges the wallet atomically, rejects conflicts, and preserves the selected Pandit, topic, depth, format, notes, and start time.
- Chat Now is enabled for an online/present Pandit, costs 101 coins, starts immediately, and has a 15-minute timed session. A busy Pandit is not silently booked; the backend returns live status and the app may join a queue of at most five with a 15-minute maximum wait and a 60-second turn timeout.
- If the Pandit does not join within the backend waiting timeout (currently 10 minutes), the full booking charge returns to the wallet. Ending before the Pandit joins also follows the full-refund path.
- Once a session starts, the backend owns the countdown and emits remaining time. The session ends at the server end time. The first 90 seconds are the eligible full-refund grace period; a Pandit disconnect after that can receive a server-calculated partial unused-time refund.
- Audio/video can be joined from 15 minutes before the scheduled start through the server end time. Leaving the room does not end the booking; the customer can rejoin while the original window remains open.
- Existing bookings retain their stored duration, price, and session model. New website copy must not rewrite legacy records.

## Website behavior

1. The public Pandit profile presents two meaningful actions: a scheduled booking path and Chat Now only when the backend presence/status allows it. Notes are optional inside booking, never a hero CTA.
2. The booking flow loads the backend catalog and quote, then loads the backend’s slots for the selected duration. It shows format, duration, total coins, Pandit, topic, and cancellation/refund summary before the final confirmation.
3. The first vertical slice is scheduled audio: select depth, topic, date/time, optional note, review backend quote, confirm, and land on the existing booking detail page.
4. Video and scheduled chat reuse the same flow after the first slice is proven. Chat Now uses the separate backend endpoint and status/queue response; it never pretends an offline or busy Pandit is immediately available.
5. Bookings and sessions use the same existing website proxy and session bootstrap. The proxy forwards `X-Client-Platform: web`, allows only the required paths, and does not expose access tokens to browser JavaScript.
6. The chat/audio/video room visibly renders server timer events, waiting/no-show status, end-of-session status, disconnect recovery, and wallet-refund confirmation. The UI cannot invent or extend time locally.
7. Remove website-only “No Timer”, “opening soon”, “new bookings paused”, and draft-only booking messaging from the live booking surfaces once the flow is connected. Keep honest legacy-booking language only where it describes existing records.

## Release gates

- No website price or duration constant is used to decide a charge.
- No website booking success is simulated; a successful confirmation must come from the backend response.
- Unauthenticated wallet, booking, and mutation paths remain protected.
- A stale or conflicting slot refreshes safely without a second charge.
- Chat Now handles offline, busy, queue-full, queue-expired, insufficient-wallet, timeout/refund, and reconnect states.
- Existing booking records remain readable and resumable under their stored terms.
- Desktop and 360px mobile layouts keep the summary, total, confirmation action, and error recovery readable without horizontal overflow or layout shift.
