# Wallet ledger refunds

Issue #256: a partial return and a full refund both looked like a generic refund, and full refunds included a booking id.

## What changed

- Unused time is stored as `partial_refund` with the coin amount only. The full session price is not written into `amountInr` on that row.
- A full refund is linked to the booking and described in plain language (`Full refund — session did not go ahead`, or the trial window).
- The wallet list labels those rows and says the coins go back to the wallet, not the bank. Older rows that still say `Partial refund` or `Refund for booking <id>` use the same labels.

Tracks #256.
