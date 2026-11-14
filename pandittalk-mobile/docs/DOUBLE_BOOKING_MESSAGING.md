# Double-booking race client messaging

Issue #273: when two users race the same slot, the loser saw a vague failure.

## Change

- Backend conflict response uses code `SLOT_TAKEN` with plain copy
- Slot picker maps 409 / slot-taken / pandit-busy to a clear alert and offers **Refresh slots**
- Clears the stale selected start time so the user must pick again

Tracks #273.
