# Remove hot-path `console.log` (GitHub #280)

## Why

Chat and wallet paths were logging message bodies / transaction objects / Razorpay
order payloads to the Metro/device console — JS work on hot paths and possible PII
leakage in production builds (App Store review risk).

## Changes

Removed debug `console.log` from:

- `app/session/chat.tsx` (API base, session join, each new message)
- `app/wallet/index.tsx` (per-transaction dump)
- `app/wallet/recharge.tsx` (packages + Razorpay order JSON)
- `app/experts/[id].tsx` (booking step debug)
- `app/tools/palm-reading.tsx` (base64 length)

User-facing `Alert`s for payment failures remain.
