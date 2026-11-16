# Mobile capability parity specification

Paths below are relative to the monorepo. Status means source-observed unless explicitly described as a gap. All P requirements are release requirements. The timed-booking parity review supersedes the earlier no-timer direction for new web bookings; preserve consultation capability and existing booking terms. A redirect alias or layout is accounted for, but is not a separate feature.

## P01 — Home and navigation

Source: `apps/mobile/app/(tabs)/index.tsx`, `home.tsx`, `_layout.tsx`, `components/TabTopHeader.tsx`, `components/GuidanceHubContent.tsx`.

Web: public `/`, signed-in `/home`. Include greeting/profile state, wallet access, guidance entry, tools, experts and articles. Signed-in home prioritizes active session and next booking. Desktop navigation and mobile bottom navigation must reach Home, Pandits, Guidance, Tools and Account. Notification and wallet actions remain reachable. No dummy popularity or availability data on failures.

## P02 — Identity and profile

Source: `app/login.tsx`, `verify-otp.tsx`, `link-phone.tsx`, `profile-setup.tsx`, `lib/authApi.ts`, `store/useAuthStore.ts`; `(tabs)/profile.tsx` re-exports profile setup.

Web: `/login`, `/verify-otp`, `/link-phone`, `/profile-setup`, `/account/profile`. Preserve OTP request/verify/resend, Google/Apple identity paths, required phone completion, session refresh/logout, avatar upload and all fields from the profile DTO. Inspect DTO restrictions rather than inventing a generic name/email-only account. Return to the original safe internal destination after login. Handle expired/incorrect OTP, rate limits, social account conflicts and interrupted onboarding. Google/Apple browser configuration is a dependency, not grounds to silently remove those sign-in methods.

## P03 — Pandit discovery

Source: `app/(tabs)/experts.tsx`, `lib/expertsApi.ts`.

Web: `/pandits`. Preserve categories, Premium filter and sorting by experience, rating and review count. Include clear/reset filters, empty/error/loading states, language display, image fallback and truthful online/busy/offline state. Add name search and language filtering only against supported data; disclose sorting criteria and any sponsored ordering. Preserve source categories, including marriage/family, career/business, love/relationships, finance/wealth, health/wellbeing, life path, spiritual protection and legal-related concerns. Use careful spiritual-guidance labels without dropping underlying category mappings.

## P04 — Pandit detail

Source: `app/experts/[id].tsx`, `app/expert/[id].tsx` and `lib/expertsApi.ts`.

Important source distinction: singular `app/expert/[id].tsx` contains mock practitioner records and placeholder biography text. It is a legacy prototype, not a second source of practitioner truth. The plural `experts/[id].tsx` and API-backed discovery are the functional reference. A web redirect from the singular route is proposed compatibility behavior, not an assertion that the mobile file is already a redirect.

Web: `/pandits/[id]`; compatibility redirects from `/experts/[id]` and `/expert/[id]`. Include biography, practice, experience, languages, rating/count, reviews where available, articles, session formats, prices, availability and booking/chat actions. Preserve busy/queue and resume-active-chat behavior. Missing verified evidence means omit the verification claim, not invent it. Unpublished/deleted experts get a helpful unavailable state.

## P05 — Guided selection

Source: `app/guidance/start.tsx`, `flow.tsx`, `start-guidance.tsx`, `(tabs)/guidance.tsx`, `store/useGuidanceFlowStore.ts`, `lib/bookingPricing.ts`.

Web: `/guidance`, `/guidance/start`. Preserve area → notes → service scope → format → expert selection, using the backend-approved timed depths and formats before slot selection. Areas: career, love, family, marriage, education, health, business, finance. Notes are optional and private. Preserve draft during back navigation and recharge/login without putting notes into URLs. Explain price changes as scope/format changes; prohibit hidden premium defaults.

Also preserve tool-to-guidance handoff from `lib/guidanceFromTool.ts`: Kundli, detailed Kundli, daily/monthly horoscope, compatibility, detailed compatibility, palm and tarot can prefill relevant notes/topic. Show the prefilled text for customer review and editing. The mobile helper limits notes to 200 characters; reconcile this with the backend DTO. Replace mobile route-parameter notes with private browser state or authenticated draft storage so names and reading context never enter web URLs.

## P06 — Scheduled booking

Source: `app/booking/select-slot.tsx`, `confirmation.tsx`, `lib/bookingApi.ts`.

Web: `/bookings/new`, `/bookings/[id]`. Include date, capacity-aware availability under the backend timed scheduling policy, explicit timezone, selected Pandit/area/format, notes, coin total, wallet balance, cancel terms and confirmation. Server revalidates slot and total atomically; duplicate clicks cannot create duplicate charges. Recover from slot taken, low coins, timeout and unknown booking outcome. Confirmation is based on persisted booking, not query-string success. Add a downloadable calendar entry as a browser convenience; no external calendar write required.

## P07 — Instant chat and queue

Source: expert screens, `lib/bookingApi.ts`, additional chat helpers in `lib`, backend `bookings.controller.ts` queue endpoints.

Web: discovery/profile chat action → `/sessions/[bookingId]/chat`. Preserve online start, busy queue join/status/leave, accepted and missed requests, pending/active booking recovery, insufficient balance and offline state. Refresh must reconnect to the existing booking. Never describe this as per-minute billing: source defines a legacy fixed-duration instant-chat package; replace its timer behavior under D11.

## P08 — Chat session

Source: `app/session/chat.tsx`, `lib/chatSocket.ts`, backend `chat/chat.gateway.ts`.

Include persisted history, message send/receive, typing, connection state, server-authorized session state without a countdown, waiting/start/end events, reconnect, grace/refund feedback and post-session review. Keep drafts when a send fails; confirm delivered state from server acknowledgement. Deduplicate by persisted message ID. Unknown outcome after reconnect requires history reconciliation, not automatic resending. End and leave semantics must match server behavior.

## P09 — Audio session

Source: `app/session/audio.tsx`, native WebRTC adapter, backend `webrtc/audio-session.controller.ts`, audio socket events.

Web: `/sessions/[bookingId]/audio`. Browser microphone permission, device check, waiting room, join, mute, participant presence, server-controlled timed lifecycle, reconnect, leave/rejoin, end, grace refund, completed review. Implement browser WebRTC with Socket.IO signaling; native-module imports cannot ship to web. Release browser tracks and subscriptions on exit.

## P10 — Video session

Source: `app/session/video.tsx`, backend `webrtc/video-session.controller.ts`, video socket events.

Web: `/sessions/[bookingId]/video`. Audio requirements plus camera permission/preview, camera toggle/device choice, local/remote tile, camera-off state and camera-state signaling. Test camera refusal while microphone works. Do not silently change the charged format when permissions fail. Provide recovery or policy-backed cancellation.

## P11 — History and reviews

Source: `app/bookings/history.tsx`, `review.tsx`, `lib/bookingApi.ts`.

Web: `/bookings`, `/bookings/[id]`, `/bookings/[id]/review`. Upcoming/past/cancelled states, session resume where allowed, cost/status, cancel when authorized, rating and optional comment after eligible sessions. Prevent reviews by other users or for uncompleted bookings. Show moderation explanation without suppressing legitimate criticism.

## P12 — Wallet and recharge

Source: `app/wallet/index.tsx`, `recharge.tsx`, `lib/walletApi.ts`, backend wallet controller/service.

Web: `/wallet`, `/wallet/recharge`, `/wallet/payment-status`. Coin balance, actual package list, bonus distinction, INR price, transaction history, Razorpay order and verification, cancelled/failed/pending/success outcomes. Show charge versus coin credit separately. Re-read authoritative wallet after payment, booking, report purchase or refund. Recovery after a closed payment tab must not require paying again.

## P13 — Free tools

Source: `app/tools/kundli.tsx`, `kundli-result.tsx`, `horoscope.tsx`, `horoscope-result.tsx`, `compatibility.tsx`, `compatibility-result.tsx`, `palm-reading.tsx`, `tarot.tsx`, `lib/toolsApi.ts`.

Web routes: `/tools/kundli`, `/tools/horoscope`, `/tools/compatibility`, `/tools/palm-reading`, `/tools/tarot`; results in private client state or an authorized opaque record route.

- Kundli: first/last name, birth date/time/place and supported coordinates; chart and planets with accessible text equivalent.
- Daily horoscope: sign selection and daily result, date/timezone, source-provided insight and fields.
- Compatibility: two people's input, score and emotional/communication/long-term interpretations. No marriage decision presented as determined by a number.
- Palm: left and right image selection/camera capture, preview/replace, upload bounds and reading of life/heart/head lines. Explicit AI/image processing notice before upload. No lifespan or diagnostic promise.
- Tarot: card selection/reveal interaction and returned card meaning/insight, reduced-motion version and rerun behavior. Current backend uses randomized card selection; do not imply a live Pandit selected it.

Handle invalid dates, uncertain birth time, unresolved places, image rejection, throttling and provider outages without making up results. Do not assume arbitrary overseas coordinates work correctly: backend contains an IST offset assumption.

## P14 — Paid tools and unlocks

Source: `kundli-detailed.tsx`, `kundli-detailed-result.tsx`, `compatibility-detailed-result.tsx`, `monthly-horoscope.tsx`, `toolsApi.ts`.

Web: `/tools/kundli/detailed`, `/tools/compatibility/detailed`, `/tools/monthly-horoscope` plus `/reports/[id]`. Detailed compatibility is required even though it is not a separate top-level tile in the app.

Preserve detailed Kundli narrative, doshas, dasha, lucky elements and remedies; detailed compatibility guna/dosha/strengths/challenges/remedies/outlook; monthly overview/career/relationships/health/opportunities. Explain uncertain interpretations in non-alarming language. Show cost and consent before charge. Preserve backend entitlement semantics and saved reports; establish scope per report/month/input instead of assuming every unlock is lifetime or repurchasable. Failures must have a known charge/refund outcome.

## P15 — Saved reports

Source: `app/reports/index.tsx`, `lib/reportsApi.ts`; backend reports endpoints.

Web: `/reports`, `/reports/[id]`. Show type/title/input summary/date/coins spent and render all three paid report types. Reopen purchases made in the app without new charge. Add accessible print styling; PDF export is a proposed convenience only after private rendering is safe. No public share link by default.

## P16 — Notifications

Source: `app/notifications/index.tsx`, `lib/notificationApi.ts`, `lib/notificationPreferences.ts`, `store/useNotificationStore.ts`.

Web: `/notifications`, notification badge and account preferences. Preserve unread count, read/read-all and safe destinations. Types: confirmation; 30/10/5-minute reminders; session started/ended; new message; chat accepted/missed. Current mobile preferences use local AsyncStorage: cross-device settings require new backend persistence. In-site notifications remain functional if browser push is declined or unavailable. Browser push is an enhancement needing subscription/delivery backend support.

## P17 — Articles and authors

Source: `app/articles/index.tsx`, `[slug].tsx`, `lib/articlesApi.ts`; existing website journal routes and article client.

Web: preserve `/articles`, `/articles/[slug]`, `/authors/[id]`. Include categories/pagination as API supports, cover, author, publication/update dates, readable body and relevant consultation links. Preserve legitimate attribution and publisher integration. Add reviewed educational topic pages separately; do not republish private practitioner drafts.

## P18 — Settings, support and legal

Source: `app/settings/index.tsx`, `webview.tsx`, `legal-webview.tsx`, `constants/legal.ts`.

Web: `/account`, profile/settings/privacy controls, logout, account deletion and legal/support routes in document 03. Current Change Phone and Help Center actions are coming-soon alerts. Website must provide useful help content/contact; phone change needs verified old/new-number recovery design and backend support. Do not implement a fake successful phone change. Account deletion must describe retained records accurately and use the existing protected API; it is not merely hiding the profile locally.

## Mechanical route accounting

Document 09 records every route file, including aliases, layouts and generic modal infrastructure. The executing agent must resolve each alias and compare the inventory to P01–P18 after any mobile changes. UI shell files, webviews and debugging artifacts need web equivalents only where they provide an actual user capability; they do not justify copying native infrastructure or debug output.
