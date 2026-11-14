/**
 * App Store / Play review notes — keep in sync with:
 * - TEST_OTP + TEST_OTP_PHONE_ALLOWLIST in auth.service.ts
 * - scripts/ensure-app-review-demo-user.ts
 * - apps/mobile/docs/APP_REVIEW_RUNBOOK.md
 *
 * Permanent demo (India E.164): +919999999998
 * Fixed OTP (allowlisted only): 1234
 *
 * Ops before each review: npm run ensure:app-review-demo (apps/backend)
 * Paste APP_REVIEW_NOTES into App Store Connect → App Review Information → Notes.
 */

export const APP_REVIEW_DEMO_PHONE = '+919999999998';
export const APP_REVIEW_DEMO_OTP = '1234';

export const APP_REVIEW_NOTES = `
PanditTalk — App Review notes (iOS)

DEMO SIGN-IN (no SMS)
• Phone: +91 99999 99998
• OTP: 1234 (allowlisted test number; SMS is not sent)
• Accept the 18+ Terms checkbox before Get OTP
• Profile/DOB is pre-seeded for the demo user (must be 18+)

SIGN IN WITH APPLE (Guideline 4.8 — offered alongside Google)
• Accept the 18+ Terms checkbox
• Tap Continue with Apple
• Use a test Apple ID; Hide My Email is supported
• If prompted to link a phone, use the same demo number + OTP 1234
• Full checklist: apps/mobile/docs/SIGN_IN_WITH_APPLE.md

SMOKE PATH
1. Sign in with demo phone + 1234
2. Home → find an online pandit → Chat Now (demo wallet is pre-funded ≥500 coins)
3. Optional: free astrology tools on Tools tab
4. Settings → legal links / Delete Account entry point

PAYMENTS (Guideline 3.1.3(d) Option C)
• Wallet coins fund live 1:1 pandit consultations only (Chat / Audio / Video)
• Paid digital reports / paid tools are NOT sold on iOS — use free tools or live consultation
• Reviewer wallet is pre-funded via ops script; Razorpay top-up is optional

SESSIONS
• Chat Now, Audio, and Video consultations are available on iPhone (native Chime)
• If no pandit is online, try another expert or note that live availability varies

DIFFERENTIATION (Guideline 4.3(b))
• PanditTalk is a live marketplace for verified human pandits (1:1 chat consultations),
  not a standalone fortune-telling clone
• Free astrology tools are secondary; paid value on iOS is live consultation (Option C)
• In-app entertainment / spiritual-guidance disclaimers appear on tools, booking, and chat
• No medical, legal, or financial advice claims in the binary or this review note

GEO / PHONE
• Mobile login uses India (+91) 10-digit numbers only
• No additional country geo-lock beyond the phone format

ACCOUNT
• Settings → Export my data requests a tracked data_export support ticket
• Settings → Delete Account initiates deletion / deactivation
• Privacy: https://www.pandittalk.com/privacy
• Terms: https://www.pandittalk.com/terms-and-conditions
• Refunds: https://www.pandittalk.com/refund-and-cancellation-policy
  (alias: /refund-policy)
• Account deletion: https://www.pandittalk.com/delete-account
  (alias: /account-deletion)
• Support: admininfo@pandittalk.com
• Help: https://www.pandittalk.com/help

CONTENT
• Spiritual / entertainment guidance — not medical, legal, or financial advice
• Users must be 18+ (Terms checkbox + profile DOB enforced before chat/booking)
• ASC age rating: complete questionnaire for UGC/chat (expect 17+); not Kids Category
`.trim();
