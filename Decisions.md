# PanditTalk Decisions

This file is append-only. New decisions must be added at the end; existing entries must not be edited or removed.

Each entry should record:

- Date
- Decision
- Why it was chosen
- Impact or constraints

## 2026-11-17 — Maintain an append-only decision record

- Decision: Keep project and implementation decisions in this root-level `Decisions.md` file and append new entries as development progresses.
- Why: Preserve the reasoning behind technology, architecture, and implementation choices so future changes remain consistent with previously agreed decisions.
- Impact: Before making a code change, check this file for relevant decisions. Add a new entry whenever a meaningful option, library, design, or implementation approach is chosen.

## 2026-11-17 — Use a custom Expo development build for the mobile app

- Decision: Run PanditTalk mobile with a custom Expo development build, not Expo Go.
- Why: The app uses native `react-native-webrtc` for audio/video sessions and native Razorpay support. These native modules are not included in Expo Go, so Expo Go reports that the WebRTC native module is missing even when the project dependencies are installed.
- Impact: Install the Android development APK before testing the mobile app, then connect it to the Metro development-client server. Expo Go is not a valid runtime for the current mobile feature set.

## 2026-11-18 — Point the local website at the public backend tunnel

- Decision: Set the website's local `API_BASE`, `NEXT_PUBLIC_API_BASE`, `BACKEND_URL`, and `SOCKET_URL` values to `https://api-pandittalk.dophera.tech`.
- Why: The website is being accessed remotely through its tunnel, so browser requests and Socket.IO connections must use the publicly reachable backend origin instead of the previous Worker hostname or localhost.
- Impact: The local Next.js website on port `3000` now uses the tunneled backend; Socket.IO continues to append `/chat` from the base URL. The values remain in the ignored `.env.local` file.

## 2026-11-18 — Lead the homepage with real Pandit consultations

- Decision: Position the homepage around finding and speaking with a real Pandit through private chat or a timed session. Use direct language such as `Talk to a real Pandit`, `Find a Pandit`, `Compare Pandits`, and `Start your conversation`; keep automated tools and journal content as clearly labelled secondary options.
- Why: The previous poetic hero copy communicated calmness but made the service ambiguous and increased the risk that a first-time visitor would interpret the site as an AI-generated wellness concept, an article site, or an unclear astrology tool.
- Impact: The homepage hero, process card, topics section, Pandit preview, learning section, FAQ heading, and primary navigation now communicate the human consultation flow while preserving the existing warm editorial visual system. The homepage explicitly distinguishes real Pandit consultations from automated tools.

## 2026-11-18 — Make web and mobile authentication explicit and consent-led

- Decision: Use the same authentication story on the website and mobile app: `Sign in or create your account`, Indian mobile number, a clear age/legal-consent checkbox before the primary `Send code` action, and matching Google/Apple options below it. Remove the private-space eyebrow, wallet/report references, and secondary waiting links from the first auth screen. Keep social buttons pressable when consent is missing so they focus the checkbox, show an explanation, and animate attention; show a separate honest message when a provider is not configured.
- Why: A first-time Indian visitor should immediately understand that PanditTalk provides human Pandit consultations and that the phone flow supports both new accounts and existing accounts. The previous auth page looked like an existing-user portal, gave the primary action less visual priority, made legal links look like weak helper text, and rendered social options as broken disabled controls. Aligning the two clients prevents the website and app from teaching different sign-in behaviors.
- Impact: Website and mobile auth UI now use the same copy, hierarchy, legal-link treatment, centered social separator, and consent feedback pattern. The website gates OTP send/resend/verification on consent and preserves the existing backend request contract; mobile social buttons add a short native shake animation while the existing toast explains the missing consent. Added browser coverage for the copy, legal link styling, consent attention state, unavailable-provider feedback, and responsive accessibility; the mobile verifier checks the shared wording and interaction contract.

## 2026-11-18 — Tighten authentication hierarchy without changing PanditTalk branding

- Decision: Reduce auth page width, top/card padding, inter-control gaps, secondary notice emphasis, and mobile brand-hero footprint so the phone field, consent, and `Send code` action dominate. Keep the existing warm cream, gold, olive, white, and dark-ink tokens unchanged; apply the same compact rhythm on web and mobile.
- Why: The first auth refinement clarified the product but still left the page vertically loose and distributed attention across secondary elements. Dribbble and Behance references were used only to validate structural patterns—compact form columns, deliberate spacing, and a dominant primary action—not to select a new theme.
- Impact: Website auth now has auth-scoped responsive spacing and hierarchy checks at 390px and 1440px; mobile has an opt-in compact `BrandHero` and tighter form rhythm. Existing touch targets, social-consent feedback, auth API contracts, and accessibility behavior remain unchanged.

## 2026-11-18 — Keep the authenticated mobile home as the cross-platform source of truth

- Decision: Align the website authenticated home with the existing mobile authenticated home instead of replacing the mobile experience with a generic dashboard. Keep the shared consultation flow visible on both clients: `Talk to a verified Pandit`, `Browse Pandits`, `Chat Now`, `Book chat, audio or video`, topic discovery, journal reading/search, optional tools, and account destinations.
- Why: The mobile home already had the more professional, task-led hierarchy and the user explicitly required that an option available in the app must also be available on the website. The previous website home made the service and next actions less clear by leading with generic account/dashboard language.
- Impact: The web home now mirrors the mobile home’s consultation-first information architecture and responsive rhythm without changing PanditTalk’s existing colors or branding. The website journal endpoint accepts the same search task exposed by the mobile home, and browser/mobile parity verifiers plus responsive UI coverage protect the shared contract.

## 2026-11-18 — Revert the authenticated-home parity refinement

- Decision: Revert the authenticated-home parity implementation and return the website and mobile home screens to their previous project state.
- Why: The user did not approve the new home-page direction and explicitly requested that all changes to the home page be undone.
- Impact: The website home, mobile home, journal-search wiring, and related parity tests/verifiers are restored to their prior versions. Existing authentication work and all earlier decision entries remain unchanged.

## 2026-11-18 — Improve the mobile authenticated home before touching the website

- Decision: Use the existing mobile home as the UX reference for this phase. Add a compact Pandit preview below the primary consultation actions, remove the home search overlay, keep optional tools below consultations, and defer website changes until the mobile UI/UX is approved.
- Why: The user identified the mobile experience as the more professional direction and asked for approval on mobile before applying the same information architecture to the website. The home screen should lead with the service—real Pandit consultations—rather than make visitors search before they can browse.
- Impact: Mobile is the only client changed in this phase; the website remains untouched for now. The preview is populated from the live experts API and links directly to the selected Pandit detail screen.

## 2026-11-18 — Use only supported consultation topics and exact expert filters

- Decision: Keep six home topics: `Career & Business`, `Love & Relationships`, `Finance & Wealth`, `Marriage & Family`, `Health & Wellbeing`, and `Spiritual Protection`. Route each topic directly to the corresponding Experts filter ID. Remove `Legal Advice` and `Life Path` from the home and Experts filter menu.
- Why: Legal advice is outside PanditTalk’s consultation scope, and Life Path overlaps existing career/relationship guidance. The previous home tiles silently sent Legal Advice and Spiritual Protection to unrelated fallback areas, which made the visible promise and backend result disagree.
- Impact: Backend expert-area validation and persisted guidance-area metadata now support `spiritual_protection`; at least one existing seeded Pandit is assigned to that area. No visible topic points to a different category.

## 2026-11-18 — Keep the featured Pandit preview honest and API-backed

- Decision: Select the featured Pandit from the real `/experts` response, preferring online and verified experts, then rating/review data. Show `Available now` only when the API says `isOnline`; otherwise show `Available to book`. Display actual languages, review state, and session price, with no hardcoded Pandita name, rating, reviews, or coins-per-minute claim.
- Why: The public API currently reports no online experts and no public reviews, so inventing `Pandita Meera`, `4.9`, `50 coins/min`, or online availability would mislead users and make the card brittle.
- Impact: The card degrades honestly when data is sparse and falls back to a real expert or hides when the API is empty. Selector tests cover online/verified preference, offline fallback, and an empty response.

## 2026-11-18 — Point mobile builds to the public PanditTalk API

- Decision: Configure the mobile app’s local env, env example, EAS profiles, and release fallback to use `https://api-pandittalk.dophera.tech/` (the runtime strips the trailing slash).
- Why: The app is being tested remotely and must not rely on localhost or the previous Worker hostname.
- Impact: Development and release bundles use the public backend origin. The current public endpoint has not yet been reseeded with the new `spiritual_protection` assignment, so that filter will return no experts until the backend deployment/seed is updated.

## 2026-11-18 — Limit Android release Metro workers for reliable APK builds

- Decision: Pass `--max-workers 1` only to Android’s release bundling task.
- Why: `gradlew assembleRelease` completed native compilation but Node 25’s Metro process repeatedly failed with `Zone Allocation failed` while forking workers under the host’s existing memory pressure. Limiting release bundling workers fixed the root build-environment failure without slowing normal development Metro.
- Impact: `gradlew assembleRelease` completed successfully and produced the current release APK at `pandittalk-mobile/android/app/build/outputs/apk/release/app-release.apk`. Website implementation is intentionally deferred until mobile UI/UX approval.

## 2026-11-18 — Center and enlarge the mobile authentication entry screen

- Decision: Vertically center the mobile auth content when the keyboard is hidden, center the intro and supporting copy, and enlarge the compact brand logo. When the keyboard opens, switch the content to a top-anchored layout so the phone field and primary action remain reachable.
- Why: The existing screen was visually top-heavy, the most important explanatory text was left-aligned while the brand treatment was centered, and the logo mark was too small to establish the brand clearly.
- Impact: The auth screen keeps the existing input/button behavior, legal consent, social sign-in, and brand colors while presenting a more balanced first impression across screen heights and keyboard states.

## 2026-11-18 — Style the mobile Latest feed as calm social-style article posts

- Decision: Rename the mobile home section to `Self-service tools`, place `Latest` after the tools with a 32dp separation, and render feed articles as square-image posts with a PanditTalk logo, author name, and contextual subtitle above the image. Use one quiet bottom-right metadata position that slowly crossfades between the read time and article category.
- Why: The approved design removes the unnecessary word `Optional`, prevents the tools and article feed from visually touching, gives the author row enough context to avoid dead space, and keeps secondary metadata discoverable without competing with the article image or title.
- Impact: Only the mobile home feed presentation changes; the article API, routing, existing compact/tile variants, and PanditTalk color system remain unchanged. `PanditTalk Team` uses `Curated guidance for everyday questions`; other authors use `Guidance from the PanditTalk community`.

## 2026-11-18 — Apply the approved consultation-first home flow to the website

- Decision: Rebuild the authenticated website home around the same service order as the approved mobile home: consultation hero, Chat Now and scheduled booking actions, API-backed Pandit preview, profile progress, six discussion topics, Helpful reading, Self-service tools, Latest social-style article posts, then booking and account summaries. Keep desktop layouts spacious while preserving the same content hierarchy and destinations on mobile widths.
- Why: The user asked the website and mobile app to portray the same product and UX, while acknowledging that a website should use its larger canvas rather than copy phone dimensions. A dashboard-first page made PanditTalk feel like an account utility instead of a live consultation service.
- Impact: The website home now removes the retired `Optional self-service tools` wording, separates tools and Latest by 32px, uses square flush article images with author context above them, and slowly crossfades read time/category metadata in one low-attention position. Existing wallet, updates, reports, booking, profile, and retry access remain available below the primary discovery flow.

## 2026-11-18 — Make website topic tiles preserve the selected expert filter

- Decision: Topic tiles on the website link to `/pandits?area=...`, and the Pandit directory initializes its topic filter from that query. The website filter list now uses the same six supported home topics and excludes Legal Advice and Life Path.
- Why: Visual parity is incomplete if a topic tile changes appearance but does not carry the user into the corresponding expert results. The visible service categories must also match the backend-supported Pandit areas.
- Impact: Selecting a home topic opens the directory with the matching topic already selected, while direct invalid query values fall back to the unfiltered directory.

## 2026-11-18 — Unify signed-in navigation across mobile and website

- Decision: Use Consult, Experts, Guidance, Tools, and Profile as the five primary destinations on both clients. Keep Wallet, Sessions, Reports, Notifications, Articles, and Settings in secondary account navigation. Remove the mobile menu search and duplicate Profile row, remove the website’s duplicate customer sub-navigation, and show the same five-item fixed navigation on the signed-in website at mobile widths.
- Why: The previous structure repeated the same account destinations in the mobile drawer, website header, and website customer bar. That increased cognitive load and made the website feel like a different product. The mobile app already had the clearest service-first hierarchy, so it was used as the shared source of truth while preserving existing routes and public marketing links.
- Impact: Signed-in navigation now has a single primary IA, consistent labels, responsive mobile parity, safe-area-aware website bottom navigation, and account utilities available through Profile/menu controls. Existing routes such as `/bookings`, `/account`, and `/articles` remain valid.

## 2026-11-21 — Prefer Render's runtime port for backend services

- Decision: Resolve each Nest service's listening port from the runtime `PORT` value first, then its service-specific environment variable (`USER_SERVICE_PORT` or `PANDIT_SERVICE_PORT`), and finally the existing local default.
- Why: Render assigns the public web-service port at runtime, while local development still benefits from the existing 3001/3002 defaults. This keeps both deployment and local workflows working without hardcoding the hosting platform's port.
- Impact: The user and Pandit service entrypoints bind to Render's assigned port when deployed, continue binding to their existing local ports when `PORT` is absent, and share a tested port-resolution helper in the common library.

## 2026-11-21 — Keep shared production settings aligned across local env files

- Decision: Keep `NODE_ENV=production` in the root runtime env and keep the shared production `ALLOWED_ORIGINS` list in the backend env as well as the root env.
- Why: The root Compose runtime and the backend service load different env-file paths, so relying on only one file can silently omit production mode or CORS origins depending on how the service starts.
- Impact: Both local runtime paths now have the non-secret shared settings; Render-specific `REDIS_URL`, `PORT`, and final `API_PUBLIC_URL` remain deployment-time values and are not guessed.

## 2026-11-21 — Point the Cloudflare load balancer at the Render backend

- Decision: Update the Cloudflare KV `backends_config` entry for the primary backend to `https://pandittalk.onrender.com`, while preserving the existing Kali origin as the secondary fallback.
- Why: The backend is now deployed and healthy on Render, and the Cloudflare Worker remains the shared public API/WSS front door for the website, dashboard, and mobile app. Keeping the fallback preserves the existing load-balancer topology while routing production traffic to the new deployment.
- Impact: Cloudflare's scheduled health check marks the Render origin healthy and the old Kali origin unavailable; the Worker routes through Render without changing client-facing Worker URLs.

## 2026-11-21 — Use Supabase transaction pooling for Render Prisma connections

- Decision: Keep Prisma migrations on `DIRECT_URL`, but normalize Supabase pooler `DATABASE_URL` at runtime to transaction mode on port 6543 with `connection_limit=1` and `pgbouncer=true`; set Render's runtime `DATABASE_URL` to the matching pooler parameters.
- Why: The failed Render deployment hit Supabase session-mode capacity (`EMAXCONNSESSION`) while Prisma requested a larger dedicated-session pool. Transaction pooling with one Prisma connection fits the managed database limit without changing application behavior.
- Impact: The Render deployment `dep-dc0q4d6c6qcc73f4cdk0` is live and its `/readiness` endpoint reports PostgreSQL, Redis, and MongoDB ready. Local non-Supabase database URLs remain unchanged.
