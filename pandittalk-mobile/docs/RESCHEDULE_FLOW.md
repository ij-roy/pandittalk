# Reschedule an upcoming session

Issue #272: users had to cancel and rebook.

## Flow

- History shows **Reschedule** on confirmed sessions starting more than 15 minutes from now
- Slot picker opens in reschedule mode (`rescheduleBookingId`)
- `PATCH /bookings/:id/reschedule` moves start/end if the new slot is free — no extra coin charge
- Too-soon sessions and taken slots return a clear error

Tracks #272.
