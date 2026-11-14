# 18+ age gate (chat marketplace) — GitHub #314

## Product rule

Account holders must be **18+** before booking or Chat Now. Login still requires the
Terms / “I am 18+” checkbox (legal consent). Profile **date of birth** is the
enforced age proof.

Kundli / tool birth dates for *other* people are separate and are **not** clamped
to 18+ (charts may be for children). Account profile DOB is clamped.

## Code

| Layer | Behavior |
| --- | --- |
| Mobile profile | DOB picker `maximumDate` = today − 18y; save rejected if under 18 |
| Mobile chat / booking | `ensureAdultForMarketplace` refreshes profile and blocks with prompt → profile |
| Backend `PATCH` profile | Rejects under-18 `dob`; sets `acceptedAge18: true` when DOB passes |
| Backend `POST` bookings + chat-now | `403` if missing/under-18 DOB |

Helpers: `apps/mobile/lib/age.ts`, `apps/backend/apps/user-service/src/lib/age.ts`

## ASC (console — not in this PR)

- Age Rating questionnaire: answer for unrestricted communication / UGC chat → expect **17+**
- Do **not** place the app in the Kids Category
- Product Terms remain **18+** (stricter than ASC floor)

## Verify

- Under-18 DOB cannot save on profile (client + API)
- Chat Now / scheduled booking without adult DOB → profile prompt / 403
- Adult DOB → booking and chat unchanged
