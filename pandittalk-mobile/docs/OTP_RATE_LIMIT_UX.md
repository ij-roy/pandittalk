# OTP rate-limit UX

Issue #282: flooding Get OTP showed a generic error with no wait guidance.

## Behavior

- Backend 429 includes `retryAfterSeconds` (and `Retry-After` header)
- Mobile parses that and shows **Try again in M:SS** / **Resend code in M:SS**
- Login, link-phone, and verify-otp disable the action until the countdown ends

Tracks #282.
