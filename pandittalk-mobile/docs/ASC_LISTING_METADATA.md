# App Store Connect listing metadata (#307)

Checklist + paste-ready drafts for ASC. Binary review notes live in `APP_STORE_REVIEW_NOTES.md`.

## Required URLs (must 200 without login)

| Field | URL | Status notes |
|-------|-----|----------------|
| Privacy Policy | https://www.pandittalk.com/privacy | Live |
| Terms (in notes / support) | https://www.pandittalk.com/terms-and-conditions | Live |
| Support | https://www.pandittalk.com/help | Live; email `admininfo@pandittalk.com` |
| Marketing (optional) | https://www.pandittalk.com | Live |
| Refund Policy | https://www.pandittalk.com/refund-policy | Required for IAP/wallet reviewers — deploy via #312 if still 404 |
| Account deletion | https://www.pandittalk.com/account-deletion | ASC + Play parity — deploy via #312 if still 404 |

In-app Settings also ships local legal docs (`settings/legal-doc`) as a fallback when www is down.

## Identity (match Apple Team / `eas.json` submit)

- **App name:** PanditTalk
- **Bundle ID:** `com.pandittalk.mobile`
- **ASC App ID:** `6797837559`
- **Apple Team ID:** `K54M9H3JQG`
- **Company / copyright:** Personal Astrology Numerology Directional Info Talk Tech Private Limited
- **Contact:** admininfo@pandittalk.com

## Category

- **Primary:** Lifestyle (preferred) — spiritual guidance / consultations
- **Avoid:** Medical — do not claim medical advice (entertainment disclaimers)

## Age rating (honest answers)

Expect **17+** when answering ASC questionnaires for:

- User-generated messaging (chat with pandits)
- Frequent/mild mature themes possible in spiritual guidance
- Unrestricted web access only if in-app browsers allow it (mobile WebView is allowlisted — declare accordingly)
- In-app purchases / consumable coins for consultations

Do **not** claim Gambling if coin packs are only for consultations (Option C), but answer paid digital goods accurately.

## Name / subtitle / keywords (draft — edit before ship)

**Name (30):** `PanditTalk`

**Subtitle (30):** `Live pandit chat & guidance`

**Keywords (100 chars, comma-separated, no spaces after commas if tight):**
`astrology,pandit,kundli,horoscope,tarot,spiritual,vedic,consultation,chat`

**Promotional text (170, updatable without review):**
Talk live with verified pandits for kundli, horoscope, and spiritual guidance. Entertainment only — not medical or legal advice.

## Description (draft)

```
PanditTalk connects you with verified pandits for live chat and consultations.

WHAT YOU CAN DO
• Book live chat (and audio/video where available) with pandits
• Free astrology tools: kundli, horoscope, compatibility, tarot, and more
• Wallet coins for live 1:1 consultations
• Session reminders so you never miss a booking

IMPORTANT
Guidance is for entertainment and spiritual reflection only. It is not medical, legal, or financial advice. You must be 18+.

SUPPORT
Help: https://www.pandittalk.com/help
Privacy: https://www.pandittalk.com/privacy
Account deletion: https://www.pandittalk.com/account-deletion
```

## Screenshots

Required sizes for devices you support (`supportsTablet: true` → include iPad if shipping tablet).

Capture from **TestFlight iOS** builds only:

1. Home / guidance hub
2. Expert list or detail
3. Live chat session (demo account)
4. Free kundli / horoscope result with entertainment disclaimer visible
5. Wallet / recharge (Option C — consultations)
6. Settings showing Privacy / Delete account

Rules:

- No Android-only UI
- No placeholder / lorem / debug overlays
- Prefer light UI (#59/#71)

## App preview video (optional)

30s max: open app → pick pandit → chat → disclaimer.

## Human checklist before Submit for Review

- [ ] All URLs above return 200 logged-out
- [ ] Age rating questionnaire completed
- [ ] Screenshots uploaded for required device classes
- [ ] Review notes pasted from `APP_STORE_REVIEW_NOTES.md`
- [ ] Demo OTP account works on production
- [ ] Copyright / trade name matches Team
- [ ] Privacy nutrition labels (#306) filled in ASC
