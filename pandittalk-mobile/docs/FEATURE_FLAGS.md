# Feature flags

Issue #278: payments and paid tools needed a kill switch that does not wait for an app release.

`GET /config/features` reads two environment variables on each request:

- `FEATURE_PAYMENTS` defaults to on. Set it to `false` to stop new coin checkouts. Existing balances stay usable.
- `FEATURE_DIGITAL_TOOLS` defaults to off, matching the paused paid-report unlock. Set it to `true` only when unlocks should reopen.

The wallet hides Add Coins when payments are off. Paid tool cards stay hidden on iPhone, and they also stay hidden when the digital-tools flag is off.

Tracks #278.
