# App Review runbook — GitHub #308

## Goal

Reviewers can sign in **without SMS**, complete Chat Now (or free tools), and escalate if stuck.

## Permanent demo credentials

| Field | Value |
| --- | --- |
| Phone | `+919999999998` (`+91 99999 99998`) |
| OTP | `1234` |
| Source of truth | `TEST_OTP` + `TEST_OTP_PHONE_ALLOWLIST` in user-service auth |

**Never** set `ALLOW_TEST_OTP=true` in production. Only allowlist this number.

## Pre-submit checklist (ops)

1. Confirm Secrets Manager / prod env:
   - `TEST_OTP_PHONE_ALLOWLIST` includes `+919999999998`
   - `ALLOW_TEST_OTP=false`
2. Seed / refresh demo wallet + adult DOB:

```bash
cd apps/backend
npm run ensure:app-review-demo
# or: npx ts-node scripts/ensure-app-review-demo-user.ts +919999999998 500
```

3. Paste `APP_REVIEW_NOTES` from `apps/mobile/docs/APP_STORE_REVIEW_NOTES.md` into
   App Store Connect → App Review Information → Notes.
4. Smoke on TestFlight: login → Chat Now (online pandit) → confirm session UI loads.

## Smoke path (reviewer)

1. Accept 18+ Terms → phone `9999999998` → OTP `1234`
2. Home → online pandit → **Chat Now** (wallet pre-funded)
3. Optional: Tools → free kundli / horoscope
4. Optional: Sign in with Apple → link same demo phone if prompted

## Notes

- Paid digital tools stay blocked on iOS (Option C); consultations use coins.
- Chat Now costs **101** coins; demo seed uses **500**.
- Age gate (#314): demo user DOB is set to an adult date by the ensure script.
- Escalation: `admininfo@pandittalk.com`
