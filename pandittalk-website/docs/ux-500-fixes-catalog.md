# PanditTalk UX 500+ fixes catalog

Generated from the Goal Mode transcript loop (`1eb7246d-20a4-408c-868b-6474d697c31f`) and nested subagent fix summaries.

- **Estimated total (goal claim):** 500+
- **Unique recoverable items listed:** 1998
- **Generated at:** 2026-09-21T17:48:32.084Z

## Conversion honesty (227)

| # | Issue | Fix |
|---|---|---|
| 1 | NotifyOpenForm | success/error follow-ups add free tools + prepare draft (`source` still required) |
| 2 | Legal/cookie/delete | cookie notify/footer + delete “staying” aside get keyboard next steps; privacy/terms footer adds tools/draft |
| 3 | NotifyOpenForm | submit exposes `aria-busy` (`source` still required) |
| 4 | Account privacy | pause hint + manage free tools (offer group keeps `source`) |
| 5 | `tsc --noEmit` | Passes. Skip `#site-content`; OfferNotice/NotifyOpenForm `source` required. |
| 6 | Soft-404 recovery + notify rows | `aria-describedby` hints (source still required; skip = site-content) |
| 7 | Pricing double email capture | `src\app\(public)\pricing\page.tsx`: `OfferNotice` already embeds `NotifyOpenForm`, then another form below. **Fix:** Use `OfferNotice compact` (or drop the second form). |
| 8 | Profile OfferNotice too heavy | `ExpertDetail.tsx` uses full `OfferNotice` (with form) inside the CTAs panel. **Fix:** Pass `compact` and keep one notify surface elsewhere. |
| 9 | Pandits OfferNotice placement | `src\app\(public)\pandits\page.tsx` puts a custom aside *after* the directory. **Fix:** Put `<OfferNotice compact />` above `ExpertDirectory`. |
| 10 | WaitlistForm vs NotifyOpenForm duplication | `WaitlistForm.tsx` duplicates sheet URL/logic; weaker a11y; launch copy vs “No Timer”. **Fix:** Delete `WaitlistForm` and route callers through `NotifyOpenForm`. |
| 11 | PaidTool empty state | `PaidTool.tsx` has no “notify when purchases open”. **Fix:** Embed `NotifyOpenForm` or OfferNotice compact. |
| 12 | Footer Legal overcrowded (8 links) | causes dense mobile stack / wrap risk with `white-space:nowrap` CTAs (`.footer-top .button`). **Fix:** Group “Policies” page or allow CTA wrap (`white-space: normal` on small screens). |
| 13 | `html`/`body` lack overflow clamp | `globals.css` no `overflow-x: clip`; sticky header margins + nowrap CTAs + customer nav scroll can bleed. **Fix:** `html { overflow-x: clip; }` and audit `.footer-top .button`. |
| 14 | `SiteFooter.tsx` | Apply CTA uses `/join-as-pandit`; support mailto announces email app for AT |
| 15 | `OfferNotice.tsx` | Compact mode always keeps “Get notified” even when pricing self-link is hidden |
| 16 | Notify status | Escape returns focus to email (`source` still required) |
| 17 | A11y cleanup** | Removed Escape `sr-only` spam on notify status + GoBackButton; stripped global-error clip hint; shortened sticky pause copy. |
| 18 | Large-text reflow | `split-section` / numbered lines use `minmax(0,…)`; editorial caption wraps; notify button + footer CTAs stack under 900px. |
| 19 | NotifyOpenForm | Escape clears incomplete/errored email (`source` still required). |
| 20 | Reading follow-ups | `no-print` actions; clearer print honesty; free-tools CTA. |
| 21 | `src/app/(public)/editorial-policy/page.tsx` | Editorial policy claims articles keep “image credit and correction route,” but article pages show neither. — Soften copy, or add credit + correction CTA on article detail. |
| 22 | `src/components/articles/ConsultCta.tsx` | Google Play link opens a new tab without an SR new-tab announcement. — Add `sr-only` “(opens in a new tab)”. |
| 23 | Notify success copy covers help / editorial / about / approach / how-it-works / tools index | Applied the fix described in the UX improvement loop. |
| 24 | Guidance draft storage:** Failed browser save keeps a durable notice (Escape blurs, doesn’t clear), with tools / Pandits / contact recovery and clear charge honesty. | Applied the fix described in the UX improvement loop. |
| 25 | NotifyOpenForm a11y:** Visible “Email for launch updates” label (not sr-only-only); follow-up row keeps recovery without hint spam; `source` still required. | Applied the fix described in the UX improvement loop. |
| 26 | OfferNotice:** Next-step links kept; removed redundant sr-only / `aria-describedby` spam; `source` still required. | Applied the fix described in the UX improvement loop. |
| 27 | Article ConsultCta | compact waitlist (`website_article_consult`) |
| 28 | NotifyOpenForm | focus email field on errors |
| 29 | Pandit sticky | hide returns focus to the primary draft CTA |
| 30 | Large-text overflow | footer CTA stacks by 900px; topic links / section headings wrap with min-width clamps |
| 31 | NotifyOpenForm | contact / for-pandits success copy (separate from support/application email) |
| 32 | NotifyOpenForm | follow-up group hint (`source` still required) |
| 33 | Cookie policy | storage + footer add draft (`NotifyOpenForm` still requires `source`) |
| 34 | `src/components/site/NotifyOpenForm.tsx` (~L99–118) | Applied the fix described in the UX improvement loop. |
| 35 | GuidanceFlow inline notify | Applied the fix described in the UX improvement loop. |
| 36 | Mobile sticky Hide/Escape | Restores focus to visible `.profile-draft-restore` / `#profile-heading`, not the `display:none` primary CTA. |
| 37 | `src/app/not-found.tsx` | No primary recovery for typed URLs (search or “check the link”); only destination links. Add a short “Go back”/`history.back()` or help search CTA. |
| 38 | `src/app/(public)/about/page.tsx` | Thin conversion: belief + org only; add one clear next step beyond approach/how-it-works (e.g. notify/Pandits). |
| 39 | `src/app/(legal)/cookie-policy/page.tsx` | No cookie inventory table (name/purpose/duration); policy claims honesty but lists none. |
| 40 | `src/features/experts/ExpertDetail.tsx` | `aria-hidden="false"` on sticky CTA is noise; remove or set properly when redundant. |
| 41 | `src/components/site/OfferNotice.tsx` | Compact mode is conversion-dead (CSS hides form); either keep a “Notify me” link or don’t use compact on profiles. |
| 42 | `src/components/site/NotifyOpenForm.tsx` | Validation/API errors use `role="status"` + polite live region; use `role="alert"` / `aria-live="assertive"` for errors. |
| 43 | `src/components/site/NotifyOpenForm.tsx` | No `aria-invalid` / `aria-describedby` on the email field when invalid. |
| 44 | `src/components/site/NotifyOpenForm.tsx` | Hardcoded Apps Script URL + no honeypot/rate-limit messaging; failures feel opaque—surface a contact fallback. |
| 45 | `src/components/site/NotifyOpenForm.tsx` | After success, button still says “Notify me”; switch to “You’re on the list” / disable resubmit. |
| 46 | `src/app/globals.css` `@media print` | Hides header/footer/actions but not `.profile-sticky-cta`, `.journal-sidebar`/ConsultCta, or customer shell chrome beyond nav. |
| 47 | `src/app/globals.css` | `--muted: #66685e` on `--paper` and `.notify-open-status { color:#7a6a52 }` are borderline for small helper text; darken for WCAG AA. |
| 48 | `src/components/articles/ConsultCta.tsx` | App CTA is Play Store only; add iOS waitlist/download parity. |
| 49 | Expert sticky CTA | `NotifyOpenForm` with `source="website_pandit_sticky"` + layout CSS |
| 50 | Journal empty list | `role="status"`, named category copy, guidance CTA |
| 51 | Journal ConsultCta / home | Play Store links open in a new tab with sr-only note |
| 52 | Reports soft-404 | missing reports use a dedicated empty panel + paused-purchase honesty |
| 53 | Notify waitlist | moves focus to status/alert after success or validation errors |
| 54 | Information pages:** title overflow-wrap, table focus outline, full-width CTAs under 650px | Applied the fix described in the UX improvement loop. |
| 55 | error / global-error** “Try again” clears busy state in `finally`; crash UI offers both contact form and mailto. | Applied the fix described in the UX improvement loop. |
| 56 | For Pandits** uses practitioner “applications open” notice + notify `source` (not seeker OfferNotice). | Applied the fix described in the UX improvement loop. |
| 57 | Guidance topics | Inline `NotifyOpenForm` with `source={website_guidance_topic_*}` |
| 58 | NotifyOpenForm | Refocus email after “Use a different email”; `enterKeyHint="send"`; tighter paid-report source matching |
| 59 | Expert sticky CTA | `role="region"` + pause-aware label |
| 60 | `d:\Projects\pandittalk-website\src\features\experts\ExpertDetail.tsx` | Load failure and missing profile share one message/Retry path. — Branch 404 vs network (distinct copy + primary CTA). |
| 61 | Home editorial | Section landmarks, story sequence as ordered list, learning-card CTAs use `text-link`, reduced-motion drops backdrop blur |
| 62 | Monthly horoscope | Specialized pause page (no-charge honesty, free daily CTA) |
| 63 | NotifyOpenForm | `aria-busy` while saving; submit tied to status/help |
| 64 | Guidance index | Prepare / Pandits / tools / draft-help CTAs keyboard-grouped |
| 65 | Guidance topics | draft CTAs + related-topic rows Arrow / Home / End |
| 66 | `d:\Projects\pandittalk-website\src\app\page.tsx` | FAQ JSON-LD answers omit the in-page link sentences (help/pricing/notify CTAs), so schema ≠ visible FAQ. **Fix:** Build `mainEntity` from the same answer strings rendered in the accordion (including link text), or drop schema until they match. |
| 67 | `d:\Projects\pandittalk-website\src\app\(public)\about\information.css` | `.info-hero .lede` has no `overflow-wrap`/`min-width:0`; long legal intros can overflow the hero. **Fix:** Add `overflow-wrap: anywhere; min-width: 0`. |
| 68 | `d:\Projects\pandittalk-website\src\features\experts\ExpertDirectory.tsx` | Directory shows raw “Online” while profile softens to “Shown as available in the app”; overclaims availability. **Fix:** Use the same cautious label (and keep the existing directory note). |
| 69 | `d:\Projects\pandittalk-website\src\app\globals.css` | Mobile `.expert-row` drops to 2 columns without placing the CTA (`Meet…`) via `grid-column`, so the button can jam/overflow. **Fix:** `grid-column: 1 / -1` on the CTA at ≤620px. |
| 70 | `d:\Projects\pandittalk-website\README.md` | Says notify forms post to a “configured Google Sheet endpoint”, but the URL is hardcoded in `NotifyOpenForm.tsx`, not env. **Fix:** Update README (and optionally move URL to env). |
| 71 | `d:\Projects\pandittalk-website\src\features\pandits\PanditApplicationForm.tsx` | Public spam-prone form has no honeypot (unlike `NotifyOpenForm`). **Fix:** Add hidden trap field + server/client ignore-if-filled. |
| 72 | `d:\Projects\pandittalk-website\src\features\tools\ToolForm.tsx` | Public tool POST form has no honeypot. **Fix:** Same trap pattern as notify form. |
| 73 | About / Our approach / Editorial | `NotifyOpenForm` with `website_about` / `website_our_approach` / `website_editorial_policy` |
| 74 | Disclaimer / editorial | Clearer automated vs human labels; recovery CTAs |
| 75 | Reports empty | honest pause copy; notify link stays on how-it-works |
| 76 | Help articles | `NotifyOpenForm` with `website_help_*` + related-topic keyboard nav |
| 77 | How it works | SEO/OG + intro lead with No Timer closed |
| 78 | Customer nav | visible pause line with draft / tools / notify links |
| 79 | Pandit + guidance CTAs | “Prepare a chat-format draft” (not live-chat start) |
| 80 | `d:\Projects\pandittalk-website\src\app\(public)\help\[slug]\page.tsx` (`first-consultation` tip) | Mentions draft/profiles with no CTAs; link `/guidance/start` and `/pandits`. |
| 81 | `d:\Projects\pandittalk-website\src\app\globals.css` (`.profile-sticky-cta`) | Sticky bar has no solid surface; meta/button can wash out over content—add background/blur/padding. |
| 82 | `d:\Projects\pandittalk-website\src\app\globals.css` (`.profile-sticky-cta .expert-meta`) | Rule sits outside the mobile `@media`; keep it scoped with the sticky block. |
| 83 | `d:\Projects\pandittalk-website\src\components\site\NotifyOpenForm.tsx` | Public email form has no bot trap; if you add one, use a properly `aria-hidden`/tabindex-hidden field (don’t ship a visible “company” trap). |
| 84 | Article consult CTA | Prepare actions are keyboard-navigable |
| 85 | Notify waitlist copy | Clearer success text for privacy/cookie/delete-account placements (`source` still required) |
| 86 | Profile setup | No Timer + free-tools pause links grouped |
| 87 | Pandit profile | primary “Prepare a draft” CTA in the shortcut keyboard group |
| 88 | Directory rows | View profile + Prepare a draft grouped |
| 89 | Pricing policy | waitlist (`website_pricing_policy`) |
| 90 | Pandit directory | Closed filters show an “Active: …” chip line; CTA is “View … profile”; presence says “Usually online in the app”. |
| 91 | Journal ConsultCta | heading/label match draft-only action (not a live consult CTA) |
| 92 | Guidance start metadata | draft-only title/description; removed “before you speak” conversion framing |
| 93 | Download Android | listing ≠ website charge; Play CTA notes timed in-app packs may still apply |
| 94 | Touched **OfferNotice / SoftResourceNotFound / topic pause | stripped QA “requires source / site-content” aria spam from sr-only hints |
| 95 | Journal consult CTA:** Escape closes “More ways to continue.” | Applied the fix described in the UX improvement loop. |
| 96 | Notify form:** `required` while not marked done. | Applied the fix described in the UX improvement loop. |
| 97 | Download Android + Consult CTA (+ more-ways) | skip / OfferNotice source notes |
| 98 | Directory empty/filtered/card | skip + NotifyOpenForm source notes |
| 99 | Download iOS | No Timer list + Play Store follow-ups Arrow-nav (`source` still required) |
| 100 | Guidance topic | draft CTAs + related-topic hints (`source` still required) |
| 101 | Expert directory empty state has no inline notify capture | Applied the fix described in the UX improvement loop. |
| 102 | Contact / help mailto CTAs | decorative ↗, no sr-only |
| 103 | Legal privacy/terms footer | notify aside gets keyboard next steps (how / tools / draft) |
| 104 | Accessibility page | changelog + keyboard offer links; CSS wraps `.actions` / toolbar / expert rows under large text |
| 105 | Account shortcuts + sign-out | draft links |
| 106 | Reading / download iOS hints | skip stays `#site-content`; Notify still requires `source` |
| 107 | Large-text CSS | guidance-steps stay 1-col at phone widths; contact-quick / offer-notice / link-list wrap |
| 108 | OfferNotice sources | explicit notify attribution on pandits, profile, and pricing (`website_pandits_directory`, `website_pandit_profile`, `website_pricing_offer`) |
| 109 | Tools birth-time help:** No live-Pandit implication; help when No Timer opens + draft meanwhile | Applied the fix described in the UX improvement loop. |
| 110 | Pandit profile CTA block:** “A conversation with…” | “Prepare a future draft with…” + no notify/charge |
| 111 | Guidance index:** Topic CTAs “Draft ideas for…”; lede says prepare never books/charges | Applied the fix described in the UX improvement loop. |
| 112 | `src/app/(public)/help/HelpSearch.tsx` | Escape-to-clear, always-available clear, richer empty state with contact/browse CTAs |
| 113 | `src/features/experts/ExpertDirectory.tsx` | Labeled filter fields, compact count status, honest presence copy, stronger “explore all” CTAs |
| 114 | Footer large text | help CTA wraps; footer links `box-sizing:border-box` |
| 115 | Tools birth help:** No longer implies a live Pandit is available now; points to draft + when No Timer opens. | Applied the fix described in the UX improvement loop. |
| 116 | Pandit profile / topic CTAs:** “Chat-format draft” | “Save chat as preferred format (not live).” |
| 117 | `src/app/globals.css`** (`.footer-top .button`) | Drop `white-space:nowrap` (or only apply ≥900px) so footer CTAs wrap instead of overflowing on narrow widths. |
| 118 | `src/app/globals.css`** (`.offer-notice-compact .notify-open-form`) | Dead rule: compact mode never mounts the form; delete the CSS (keep the conditional render in `OfferNotice.tsx`). |
| 119 | `src/features/experts/types.ts` (`expertFirstName`) | Add `'pandit'` to salutations so “Pandit Soniya …” doesn’t become CTA “Meet Pandit”. |
| 120 | `src/features/account/StoryContext.tsx` | `draft.length.toLocaleString()` → `toLocaleString('en-IN')` for consistent Indian grouping. |
| 121 | `landing_page/` | Orphan waitlist stack vs live Next site; either redirect/deprecate or point copy at `/` + `NotifyOpenForm` so users aren’t split. |
| 122 | `landing_page/script.js` | Public Apps Script waitlist URL still live; prefer same backend/`NotifyOpenForm` path or clearly mark as legacy. |
| 123 | Pandit sticky bar | Escape hides and returns focus to primary draft CTA |
| 124 | Pandit application success adds tools/draft (OfferNotice still needs `source`) | Applied the fix described in the UX improvement loop. |
| 125 | NotifyOpenForm: Privacy note is screen-reader-only | Show a short visible privacy line under the email field |
| 126 | Home hero honesty | “Meet Pandits” → explore profiles / private draft; no implied live meeting |
| 127 | Paid-tool pause | Heading focus; “live conversation later” → when No Timer opens; no-charge clarity |
| 128 | Accessibility changelog updated; invariants preserved (Send code unconstrained; `#site-content`; OfferNotice/NotifyOpenForm require `source`) | Applied the fix described in the UX improvement loop. |
| 129 | `d:\Projects\pandittalk-website\src\app\page.tsx` | Hero caption “Predict. Prepare. Prosper.” conflicts with disclaimer/honesty copy that rejects guaranteed predictions. **Fix:** Replace with non-outcome language (e.g. “Reflect. Prepare. Decide.”). |
| 130 | `d:\Projects\pandittalk-website\src\components\site\OfferNotice.tsx` + pandits/pricing usages | `compact` mode omits `NotifyOpenForm`, so high-intent pages miss the waitlist capture. **Fix:** Keep a compact email capture (or link with in-page form) on Pandits/Pricing. |
| 131 | `d:\Projects\pandittalk-website\src\app\(public)\for-pandits\page.tsx` | Dashboard CTA opens an external URL without `rel="noopener noreferrer"` / `target="_blank"`. **Fix:** Add `target="_blank" rel="noopener noreferrer"` (or same-tab with clear external labeling). |
| 132 | `d:\Projects\pandittalk-website\src\components\articles\ConsultCta.tsx` | Google Play link has no `target`/`rel` and opens in the same tab. **Fix:** Match download page: `target="_blank" rel="noopener noreferrer"`. |
| 133 | `d:\Projects\pandittalk-website\src\app\globals.css` + ExpertDirectory rows | Expert rows are a 3-column grid that crowds the Meet CTA on narrow screens. **Fix:** Stack portrait/copy/CTA under ~620px (full-width button). |
| 134 | `d:\Projects\pandittalk-website\src\components\ComingSoon.tsx` + `WaitlistForm.tsx` + `Lightfall.tsx` | Orphaned launch-page stack unused by any route (dead weight / dual waitlist URLs). **Fix:** Delete or wire one route; keep a single notify endpoint. |
| 135 | How-it-works | find/prepare/after recovery links; notify aside keyboard alternatives |
| 136 | Editorial + Pricing | correction/notify alternatives with tools/draft |
| 137 | Refund policy | pause/places/next LinkKeyboardGroups + notify alternatives |
| 138 | Footer CTA hint moved before actions (skip stays `#site-content`) | Applied the fix described in the UX improvement loop. |
| 139 | NotifyOpenForm follow-up hint names skip + required `source` | Applied the fix described in the UX improvement loop. |
| 140 | Large-text CSS | home-tiles, sticky CTA, journal filters, zodiac, guidance-steps |
| 141 | Accessibility changelog updated (Send code still unconstrained; skip `#site-content`; NotifyOpenForm/OfferNotice still require `source`) | Applied the fix described in the UX improvement loop. |
| 142 | Pandit sticky CTA | clarifies notify ≠ draft delivery; custom help text with `source` |
| 143 | `src/app/(public)/how-it-works/page.tsx` (`#your-story`) | Says story “is not connected yet,” but **`StoryContext.tsx`** is live. Fix: rewrite to match real save/share/delete behavior (trust + conversion). |
| 144 | `src/app/(public)/guidance/[topic]/page.tsx` | CTA to `/guidance/start` ignores topic. Fix: `?area=career` (etc.) and read it in GuidanceFlow. |
| 145 | `src/app/(public)/pricing/page.tsx` | Explains pause but no `NotifyOpenForm` (how-it-works has one). Fix: embed notify form for conversion. |
| 146 | `src/app/(public)/trust/page.tsx` | No primary CTA beyond privacy/contact. Fix: Explore Pandits + notify when terms finalize. |
| 147 | `src/app/(public)/how-it-works/page.tsx` | Step list is solid; missing deep link to tools as “try free first.” Fix: secondary CTA to `/tools`. |
| 148 | Guidance `?area=` + topic CTA (#28) | Applied the fix described in the UX improvement loop. |
| 149 | `src/content/siteIdentity.ts` | Public support address is `admininfo@…` (looks internal). **Fix:** Use `support@` (or document as official) for trust/conversion. |
| 150 | `src/components/site/NotifyOpenForm.tsx` | Posts emails to hard-coded Google Apps Script URL with no privacy disclosure. **Fix:** Disclose third-party processor + link privacy; prefer first-party API. |
| 151 | `src/features/experts/ExpertDirectory.tsx` | Empty (no filters) copy mentions email updates; CTA is only homepage notify link (OK) but filtered empty has no notify path. **Fix:** Add notify link on filtered-empty too. |
| 152 | `src/app/(public)/download/page.tsx` | iOS waitlist reuses `NotifyOpenForm` success copy about “No Timer conversations,” not App Store. **Fix:** Source-specific success strings (`website_ios_waitlist` → App Store launch). |
| 153 | Customer empty / home | HomeOverview + home notice use the how-it-works notify path; home metadata is `noindex`. |
| 154 | Topic chips / text-links / hero-secondary / learning CTAs wrap under large text (no sideways scroll) | Applied the fix described in the UX improvement loop. |
| 155 | OfferNotice hint ids unique per `source` (no duplicate `id`s) | Applied the fix described in the UX improvement loop. |
| 156 | Preference status Escape always restores a checkbox; notify/offer misconfig alerts labelled | Applied the fix described in the UX improvement loop. |
| 157 | Soft-404 recovery/notify hints | skip + `source` required |
| 158 | OfferNotice keyboard hint | skip + `source` required |
| 159 | Disclaimer trust/next/notify hints note skip | Applied the fix described in the UX improvement loop. |
| 160 | Home topics/learning + privacy/404 notify + missing-Pandit hints note skip | Applied the fix described in the UX improvement loop. |
| 161 | SoftResourceNotFound:** `notifySource` is required; waitlist always shown with source guard. | Applied the fix described in the UX improvement loop. |
| 162 | `npx tsc --noEmit`:** passed. Invariants held (Send code unconstrained; skip `#site-content`; Notify/Offer require source). | Applied the fix described in the UX improvement loop. |
| 163 | Guidance Pandit-loading step offers tools/draft while the directory loads | Applied the fix described in the UX improvement loop. |
| 164 | NotifyOpenForm / OfferNotice:** non-empty `source` required (trim + misconfig alert) | Applied the fix described in the UX improvement loop. |
| 165 | LinkKeyboardGroup | supports `as="p"` for inline help rows; a11y docs updated (`source` still required on notify/offer) |
| 166 | HomeOverview empty | Explore / draft / notify CTAs when there is no personal data yet |
| 167 | Pandit profile | “Start with chat draft” deep link (`expertId` + `format=chat`) |
| 168 | Article share | clipboard-blocked fallback shows a selectable URL field |
| 169 | Pandit profile | sticky bar + draft shortcuts add free tools (`OfferNotice`/`NotifyOpenForm` still require `source`) |
| 170 | Notify fallback | `NEXT_PUBLIC_NOTIFY_SHEET_URL` falls back to the production Apps Script URL when unset (forms still work in prod) |
| 171 | Reports empty | Pause honesty + link to detailed-report wait page |
| 172 | Homepage reflow | Hero stacks below 900px with minmax columns/wrap so large text doesn’t force horizontal scroll |
| 173 | NotifyOpenForm | Pandit/directory success copy; email autocapitalize off (`source` still required) |
| 174 | Help articles | Pause honesty banner + richer recovery CTAs |
| 175 | `d:\Projects\pandittalk-website\src\components\site\NotifyOpenForm.tsx` | no honeypot; add optional hidden `website`/`company` field and drop submissions when filled. |
| 176 | `d:\Projects\pandittalk-website\src\app\globals.css` | `.offer-notice-compact .notify-open-form { display:none }` is dead (compact never mounts the form); remove CSS or keep as intentional belt-and-suspenders — **hiding form in compact is OK**. |
| 177 | `d:\Projects\pandittalk-website\src\features\experts\ExpertDirectory.tsx` | empty *without* filters has no CTA; add Notify / Guidance links when `!hasFilters`. |
| 178 | Large-text CSS | journal-empty actions, sticky CTA stack, glance list wrap |
| 179 | NotifyOpenForm | `source` is required (matches OfferNotice attribution). |
| 180 | Profile setup | pause honesty; autofocus first name; `enterKeyHint` |
| 181 | Guidance step 2 | “What No Timer means” (offer name, not “no time left”) |
| 182 | Trust concern links; OfferNotice next steps (hint id per `source`); NotifyOpenForm follow-ups | Implemented: Trust concern links; OfferNotice next steps (hint id per `source`); NotifyOpenForm follow-ups |
| 183 | Notify form a11y | Live region only announces real success/error (not constant “No spam”). |
| 184 | Download Android | Play / draft / notify actions keyboard-grouped |
| 185 | Empty article body | recovery CTAs (journal, tools, draft, support) |
| 186 | How it works | find/prepare/pricing/join/format/story/after hints |
| 187 | Notify success copy:** Covers journal / article / customer home / accessibility sources | Applied the fix described in the UX improvement loop. |
| 188 | Pandit sticky bar:** Escape in the notify email field no longer hides the whole bar (`stopPropagation` + parent guard). | Applied the fix described in the UX improvement loop. |
| 189 | Hero conversion honesty + notify path | Completed in the autonomous UX loop. |
| 190 | tarot honesty+body | Implemented during the UX 500+ goal loop. |
| 191 | pricing/trust notify forms | Implemented during the UX 500+ goal loop. |
| 192 | download iOS waitlist | Implemented during the UX 500+ goal loop. |
| 193 | ExpertDetail instant language + full OfferNotice | Implemented during the UX 500+ goal loop. |
| 194 | NotifyOpenForm a11y | Implemented during the UX 500+ goal loop. |
| 195 | ConsultCta honesty | Implemented during the UX 500+ goal loop. |
| 196 | about/trust/pricing/download notify | Implemented during the UX 500+ goal loop. |
| 197 | hero Predict→Reflect | Implemented during the UX 500+ goal loop. |
| 198 | OfferNotice notify link | Implemented during the UX 500+ goal loop. |
| 199 | hero Reflect | Implemented during the UX 500+ goal loop. |
| 200 | OfferNotice notify | Implemented during the UX 500+ goal loop. |
| 201 | GuidanceFlow NotifyOpenForm + pandit warning | Implemented during the UX 500+ goal loop. |
| 202 | NotifyOpenForm different email | Implemented during the UX 500+ goal loop. |
| 203 | Guidance NotifyOpenForm | Implemented during the UX 500+ goal loop. |
| 204 | directory NotifyOpenForm + debounce keep list | Implemented during the UX 500+ goal loop. |
| 205 | NotifyOpenForm submit | Expose aria-busy during notify submit |
| 206 | Home hero availability honesty | Honest No Timer closed state + notify capture |
| 207 | Home closing CTA honesty | Align closing CTA with availability honesty |
| 208 | Pandits OfferNotice compact | Compact notice so results appear above the fold |
| 209 | Pricing notify forms | Notify when offerings open; require source |
| 210 | Trust page notify | Notify capture with source + privacy link |
| 211 | Download iOS waitlist honesty | Honest iOS waitlist vs Android download |
| 212 | Hero sold Find your Pandit while bookings closed | Hero honesty + brand clarity + notify capture when No Timer closed |
| 213 | Duplicate availability notice under hero | Remove duplicate notice/notify form under hero |
| 214 | FAQ homepage accordion missing | Accessible FAQ accordion with schema name |
| 215 | How-it-works story copy mismatch | Align story copy with product reality |
| 216 | Honeypot optional notify | Optional honeypot without blocking UX |
| 217 | OfferNotice compact dead CSS | Clean compact OfferNotice CSS |
| 218 | pricing sign-in CTAs | Sign-in CTAs on pricing |
| 219 | NotifyOpenForm source copy + privacy link | Required source + privacy link copy |
| 220 | pricing OfferNotice | OfferNotice on pricing with source |
| 221 | Notify/Offer source required | Require source prop on NotifyOpenForm/OfferNotice |
| 222 | Conversion honesty across CTAs | No Timer/recharge paused everywhere CTAs implied open |
| 223 | Home hero Prepare a draft | Hero adds prepare-draft path |
| 224 | OfferNotice requires source prop | Always pass source when adding OfferNotice usages |
| 225 | NotifyOpenForm requires source prop | Always pass source when adding NotifyOpenForm usages |
| 226 | Presence/online copy honesty | Avoid fake online status in public expert UI |
| 227 | NotifyOpenForm success/error follow-ups | Success/error follow-ups add free tools + prepare draft |

## Review trust (70)

| # | Issue | Fix |
|---|---|---|
| 228 | Guidance draft | Pandit load recovery + empty list recovery; explore/review rows add tools; choose-Pandit and clear-draft confirms get hints |
| 229 | Directory rating honesty lag | `trustworthyReviewStats` used in `ExpertDetail.tsx` but not in `ExpertDirectory.tsx` (still shows raw `expert.rating` / hides counts `>12` as “Reviews on profile”). **Fix:** Use `trustworthyReviewStats` in directory cards + show real counts. |
| 230 | Default sort by inflated ratings | `filterExperts` in `src\features\experts\types.ts` sorts on raw `rating`/`total_reviews`. **Fix:** Sort via trustworthy stats (or demote zero-listed-review profiles). |
| 231 | Story context UX gaps | `StoryContext.tsx`: no `id="main-content"`; generic “Saved story N”; `confirm()` delete; browser-local times without IST; no page metadata. **Fix:** Add main id, title field or first-line preview, accessible delete dialog, IST labels, `metadata` on `account/story/page.tsx`. |
| 232 | Directory “Online/Offline” beside ratings | can read as bookable (note exists only above filters, not on compact home cards). **Fix:** On compact cards, drop presence or add “not bookable yet”. |
| 233 | Review rating | Escape clears the score |
| 234 | Seed ratings | all `PANDIT_META` `rating` / `totalReviews` set to `0` (live filtered aggregates only) |
| 235 | Seed verification | seeded pandits `isVerified: false` until real verification |
| 236 | Force-online seed | `DEMO_ONLINE_PHONES` refused outside `development` (not only production) |
| 237 | Seed review blurbs | no-op path kept; overpromise copy softened; “Accurate guidance” headline toned down |
| 238 | `src/features/experts/types.ts` | `trustworthyReviewStats` only corrects inflated totals when listed reviews exist; `total_reviews` with empty `reviews` still shows seed totals. — Treat `reviews: []` + high `total_reviews` as untrusted (show “No reviews published yet”). |
| 239 | Pandit reviews empty:** Focuses once, Escape blur, honesty that draft doesn’t notify the Pandit; recovery links kept. | Applied the fix described in the UX improvement loop. |
| 240 | Guidance review | Stay on draft + skip hints on steps/nav |
| 241 | PaidTool / Pandit reviews / birth-details / For Pandits | skip notes |
| 242 | Pandit empty reviews | Stopped autofocusing mid-page empty reviews; announce with `role="status"` / `aria-live` only. |
| 243 | Review stats | When a reviews payload exists, public ratings always come from eligibility-filtered listed reviews (not inflated API totals) |
| 244 | Directory / profile copy | Label “published” / eligibility-filtered reviews; clarify seed/test rows stay hidden |
| 245 | Review submit honesty | Submit ≠ public yet; helper + post-submit path to how reviews are checked |
| 246 | Guidance review | “choose a Pandit” button + directory link keyboard-grouped |
| 247 | Pandit reviews empty | Escape leaves the notice |
| 248 | `d:\Projects\pandittalk-website\src\features\experts\ExpertDetail.tsx` | Review dates use `en-IN` without `timeZone: 'Asia/Kolkata'`; use `formatIstDate`. |
| 249 | `d:\Projects\pandittalk-website\src\features\experts\types.ts` | Reviewer “Seed” is masked, but expert **names** aren’t; extend sanitization if directory can still show seed Pandit names. |
| 250 | Pandit missing / draft shortcuts / reviews-empty | Implemented: Pandit missing / draft shortcuts / reviews-empty |
| 251 | Pandit missing/error | alert + retry; waitlist (`website_pandit_missing`); empty reviews → trust check |
| 252 | Pandit published reviews | Arrow/Home/End between articles + after-reviews tools/draft |
| 253 | Large-text stacking | journal-share, chat-empty, media actions, account grid, reviews |
| 254 | How it works | Find step: Explore Pandits + For practitioners Arrow / Home / End |
| 255 | Home Pandit preview | directory compact footer keyboard-grouped |
| 256 | Pandit reviews empty | focuses the empty recovery panel |
| 257 | ToolForm: Palm preview has no remove/clear control | Add a Clear photo button that resets file + preview |
| 258 | `d:\Projects\pandittalk-website\src\app\(public)\guidance\page.tsx` | Metadata is title-only (no description). **Fix:** Add a unique meta description for SEO/share previews. |
| 259 | `src/features/experts/ExpertDetail.tsx` | Zero reviews: text only, no empty-state action. · Add empty panel + “Prepare a draft” CTA. |
| 260 | `src/app/globals.css` + pandit profile | Sticky mobile CTA can cover reviews with no bottom breathing room. · Add mobile `padding-bottom` on the profile main. |
| 261 | `src/features/guidance/GuidanceFlow.tsx` | “Continue” never validates Pandit/format; review can show “Not selected.” Fix: soft gate or review checklist before final step. |
| 262 | `src/features/guidance/GuidanceFlow.tsx` | Step buttons allow jumping to `step + 1` without validating prior choices; Continue never checks format/area. **Fix:** Gate Continue (and step jumps) on required fields; disable Review until format chosen. |
| 263 | `src/app/(public)/trust/page.tsx` | “What is already true” claims Pandits publish intros/languages as verified facts. **Fix:** Qualify as “profiles show practitioner-provided details” until verification evidence ships. |
| 264 | `src/app/globals.css` (`.profile-sticky-cta`) | Sticky CTA lacks `safe-area-inset-bottom`; can sit under iOS home indicator and cover reviews. **Fix:** `bottom: max(12px, env(safe-area-inset-bottom))` + page bottom padding. |
| 265 | Review stats:** `trustworthyReviewStats` hides unverified API aggregates when no reviews list is present (blocks seed inflation). | Applied the fix described in the UX improvement loop. |
| 266 | Inactive seed availability | windows seed `isActive: false` so `available_slots_today` isn’t a fake full day |
| 267 | Excludes reviewers named `seed` / `test` / `demo` / `admin` / `user` / `customer` (case-insensitive) | Applied the fix described in the UX improvement loop. |
| 268 | Excludes seed reviewer phone `+919999999001` (seed uses `firstName | null`, so name-only filtering was not enough) |
| 269 | Expert list `groupBy` + detail `aggregate` + listed reviews (`experts.service.ts`) | Applied the fix described in the UX improvement loop. |
| 270 | Always use filtered live stats (default `0` / `0`) | never fall back to seeded totals |
| 271 | Seed / upsert scripts store `0` totals and exclude the seed reviewer from stored aggregates | Applied the fix described in the UX improvement loop. |
| 272 | `public-reviews.spec.ts` | 9 tests passed |
| 273 | Guidance / Our approach / empty reviews | free-tools escape hatches |
| 274 | Generic seed bios | Shared template bios show a “introduction still being prepared” note instead of fake personal voice. |
| 275 | Seed review filter | Client also drops known placeholder review blurbs; stats use public-only reviews. |
| 276 | Stable sorting | Rating/review/experience ties fall back to name A–Z. |
| 277 | Pandit profile | missing/unavailable Escape-blur + keyboard recovery; draft shortcuts + empty reviews grouped |
| 278 | Guidance review | next-steps hint |
| 279 | Review comment:** Escape clears; live count notes Escape | Applied the fix described in the UX improvement loop. |
| 280 | Sticky overlap:** Mobile `.pandit-profile` bottom padding/safe-area raised so waitlist + keyboard don’t cover reviews. | Applied the fix described in the UX improvement loop. |
| 281 | Profile reviews show “Seed” and future dates — that kills credibility. Tracing where that review data comes from. | Fixed in the UX loop. |
| 282 | Seed reviewer names destroy trust | Completed in the autonomous UX loop. |
| 283 | Profiles claim “72 reviews” but only list 3 — that’s misleading. Aligning displayed counts with real review data. | Fixed in the UX loop. |
| 284 | Inflated review counts vs listed reviews | Completed in the autonomous UX loop. |
| 285 | Inflated review counts | Completed in the autonomous UX loop. |
| 286 | review maxLength | Implemented during the UX 500+ goal loop. |
| 287 | seed reviews | Implemented during the UX 500+ goal loop. |
| 288 | ExpertDetail resume label + public review filter | Implemented during the UX 500+ goal loop. |
| 289 | Review dates honesty | No future/seed dates in public reviews |
| 290 | Public profile seed reviewer names | Strip Seed/test/demo reviewer names |
| 291 | Inflated review counts vs listed | Align displayed totals with trustworthy listed reviews |
| 292 | Directory rating honesty | Trustworthy ratings on expert cards |
| 293 | ExpertDetail public review filter | Filter non-public/seed reviews on profile |
| 294 | Empty reviews list honesty | Honest empty state instead of fake counts |
| 295 | Review rating empty default | No misleading default filled stars |
| 296 | trust practitioner-provided | Trust copy clarifies practitioner-provided |
| 297 | trustworthy reviews empty list | Honest empty reviews list |

## Payments / wallet (169)

| # | Issue | Fix |
|---|---|---|
| 298 | Home overview | reports row adds draft; empty-status row adds free tools (glance wallet/updates already hinted) |
| 299 | Sessions + payment | session help adds tools/draft; payment reference actions add tools/draft |
| 300 | Payment status | success/pending/failed/unknown/waiting/footer add free tools |
| 301 | Wallet footer | free tools + draft shortcuts |
| 302 | Recharge pause list | free-tools link |
| 303 | Wallet empty CTA skips recharge | `src\features\wallet\Wallet.tsx` empty state links `/pricing` and `/#booking-availability`, not `/wallet/recharge`. **Fix:** Add primary CTA `Link` → `/wallet/recharge`. |
| 304 | Help “first consultation” still says “Before payment”** while bookings are closed. **Fix:** Soften to “before any future payment / when booking opens”. | Applied the fix described in the UX improvement loop. |
| 305 | Wallet / notifications / reports timestamps | same local-only pattern in `Wallet.tsx`, `Notifications.tsx`, `Reports.tsx`. **Fix:** Consistent IST display helper. |
| 306 | Tools hub paused cards = dead-end UX | `tools\page.tsx` links to PaidTool pages with no notify CTA. **Fix:** Add compact notify or link to `/#booking-availability` / `/wallet/recharge` where relevant. |
| 307 | Wallet notice doesn’t deep-link recharge** even when balance > 0. **Fix:** “Learn about recharge | `/wallet/recharge`” beside support link. |
| 308 | Middleware UX silence on auth bounce | customer `layout.tsx` hard-redirects to login with no flash reason. **Fix:** `?reason=session` + AuthForm banner “Sign in to view your wallet/bookings”. |
| 309 | `help/[slug]/page.tsx` | Wallet/bookings CTAs use sign-in + `returnTo`; related help adds All topics + Contact |
| 310 | Wallet / session | empty/error focus respects reduced motion |
| 311 | Guidance draft** | Lede says prepare never charges coins. |
| 312 | Wallet / Reports / customer home** metadata | honest pause + no-charge reopen wording. |
| 313 | `tsc --noEmit`** passed; kept `newBookingBlock` “No coins will be charged”, skip `#site-content`, Notify/Offer `source` required. | Applied the fix described in the UX improvement loop. |
| 314 | Home overview errors | bookings / wallet / draft / contact recovery. |
| 315 | Payment status | draft path on unrecognized status + main actions. |
| 316 | Wallet load failure | payment help + contact recovery. |
| 317 | Payments proxy | create-order / booking pause responses explicitly say you will not be charged |
| 318 | `src/lib/api/client.ts` (`useApi`) | Every reload/`path` change does `setData(undefined)`, wiping UI (wallet balance, reports, bookings) into a loading flicker. — Keep prior data until the new response arrives (stale-while-revalidate). |
| 319 | `src/app/globals.css` | Print hides all `.actions`, so report/wallet printouts lose contextual actionless chrome inconsistently and bury non-action content grouped in `.actions`. — Scope print-hiding to chrome-only action bars (e.g. `.no-print`). |
| 320 | `src/features/wallet/Wallet.tsx` | Refresh via `useApi` clears balance/transactions entirely during reload (empty flash). — Keep showing last wallet payload while `loading` on reload. |
| 321 | Notification prefs | recharge waitlist link + clearer product-news note |
| 322 | Payment status honesty:** Unrecognized status no longer looks like “still waiting”; adds payment help + contact. Waiting copy only when a reference exists with no status (pending already had its own block). | Applied the fix described in the UX improvement loop. |
| 323 | Payment reference actions:** Payment help link; clearer “copy ≠ credit / recharge paused” status; dropped redundant keyboard-hint spam. | Applied the fix described in the UX improvement loop. |
| 324 | Wallet empty transactions:** Different copy for zero vs non-zero balance so empty history isn’t a recharge offer. | Applied the fix described in the UX improvement loop. |
| 325 | Customer home | `OfferNotice` (`website_customer_home`) + recharge notice |
| 326 | Home glance Try again (bookings/wallet/updates) | `aria-busy` + disabled while reloading |
| 327 | Download / guidance / payment pending | draft or free-tools escape hatches |
| 328 | Reports / wallet / prefs / profile / story / bookings Try again | `aria-busy` + skip where missing |
| 329 | Errors / footer / wallet / contact | draft + Pandits recovery; footer draft CTA; empty-wallet draft path; contact privacy notice status |
| 330 | Payment status / delete-account | focus primary heading after load / deletion |
| 331 | Payment status | “Still waiting?” recovery links |
| 332 | `src/app/(customer)/wallet/payment-status/page.tsx` (~L27–30) | Applied the fix described in the UX improvement loop. |
| 333 | `src/features/wallet/Wallet.tsx` (~L17) | Applied the fix described in the UX improvement loop. |
| 334 | payment-status status allowlist | Applied the fix described in the UX improvement loop. |
| 335 | Remaining copy/a11y one-liners (Wallet, download, authors, legal RichText) | Applied the fix described in the UX improvement loop. |
| 336 | Pricing first viewport | Title/intro lead with payments paused, not “before you pay” as if open now. |
| 337 | Home overview focus race | Errors win focus; glance list stays visible when empty bookings + wallet/updates errors. |
| 338 | Account privacy | Bookings / wallet / waitlist shortcuts in pause notice |
| 339 | Payment status | copy reference, mailto with reference, clearer path when no reference |
| 340 | Cancel / refund honesty | Refunds not automatic or guaranteed; check wallet for the final outcome |
| 341 | Payment status | Guidance only; wallet is source of truth; success/authorized/credited/refunded ≠ confirmed credit; recharge stays paused |
| 342 | Payment reference | Copying a reference does not confirm coins were credited |
| 343 | Wallet trust | Balance excludes pending; settled rows note recharge is still paused |
| 344 | Home conversion | Customer home + glance: signing in / viewing balance does not open booking or recharge; payment-status shortcut added |
| 345 | Payment status** shows “Still waiting?” only for pending/authorized or no recognized hint | not after success/failed. |
| 346 | Guidance final step** is “Saved draft”; dropped wallet/price checkout framing; charge line says none while paused (`newBookingBlock` unchanged). | Applied the fix described in the UX improvement loop. |
| 347 | Home wallet glance** no longer always pushes Payment status for never-paid users. | Applied the fix described in the UX improvement loop. |
| 348 | AuthForm / login | Pause honesty before sign-in (bookings/recharge stay closed); `type="submit"`; **Send code** still unconstrained by consent |
| 349 | `d:\Projects\pandittalk-website\src\features\account\HomeOverview.tsx` | Wallet glance reads `wallet.data.balance`, but the API/Wallet UI use `coinBalance`, so balance always shows “unavailable.” — Read `coinBalance` (same as `Wallet.tsx` / `GuidanceFlow.tsx`). |
| 350 | `d:\Projects\pandittalk-website\src\components\site\NotifyOpenForm.tsx` | Success copy only special-cases `ios`; `website_paid_tool` / `website_wallet_recharge` still say “No Timer opens.” — Branch success text by source (reports open / recharge open). |
| 351 | Home glance wallet | existing balance labeled as not a recharge offer or booking unlock; tools + draft recovery links added |
| 352 | Wallet balance panel | clarifies balance ≠ top-up and does not unlock paused No Timer bookings |
| 353 | Phone change | pause honesty (security only, no booking/coins); failure recovery to help/support/tools/draft/updates |
| 354 | QueuePanel restored | “No coins will be charged” + leave/refresh/bookings/tools/draft recovery |
| 355 | Payment unrecognized status | never credits coins; keyboard recovery/skip hints |
| 356 | Pricing policy | Links to pricing, refunds, how-it-works, wallet, terms |
| 357 | PaymentReferenceActions | Focus status after copy; wallet balance link |
| 358 | Payment reference | Copy / Email / wallet via shared keyboard group |
| 359 | `d:\Projects\pandittalk-website\src\features\wallet\Wallet.tsx` | Empty state still shows the “Recent transactions” toolbar/`<h2>` above a second “No transactions yet” heading. **Fix:** When empty, replace toolbar heading with one empty-state heading + refresh control. |
| 360 | `d:\Projects\pandittalk-website\src\features\wallet\Wallet.tsx` | Empty transactions panel has no `role="status"`, so AT may not announce it after load. **Fix:** Add `role="status"` (or live region) on the empty section. |
| 361 | Account privacy | Booking/recharge pause notice; reports link; privacy mailto with body template |
| 362 | Wallet recharge | Pricing/refund links; recharge list ≠ booking list |
| 363 | Payment status | Link to why recharge is paused |
| 364 | Cookie / refunds | Sign-out path; wallet/payment/booking recovery while paused |
| 365 | Wallet recharge | notify is the primary job; wallet/pricing demoted |
| 366 | Payment reference | Arrow keys across Copy / email / wallet |
| 367 | Sessions / notifications / download / recharge / route error | Escape blur or extra recovery paths |
| 368 | Payment help | steps for existing pending payments only; no “start another payment” |
| 369 | `d:\Projects\pandittalk-website\src\app\(public)\help\[slug]\page.tsx` (`coins-and-payment-pending` tip/steps) | Mentions payment status/wallet without links; link `/wallet/payment-status` and `/wallet`. |
| 370 | Payment status | All recovery/next-step action clusters use LinkKeyboardGroup |
| 371 | Home overview | bookings / wallet / updates retry+open rows grouped |
| 372 | Home overview | Empty home collapses redundant tiles into CTAs + short wallet/updates line. |
| 373 | NotifyOpenForm | field label is placement-honest (availability / recharge / iOS / paid reports), not generic “launch updates” |
| 374 | Recharge alternatives list + footer | skip + NotifyOpenForm source notes |
| 375 | Customer-home wallet-pause aside | Escape blur |
| 376 | Home overview | Glance booking/wallet/updates/reports link rows use `span` groups |
| 377 | Wallet load + recharge-pause | draft recovery |
| 378 | Inline profile, Pandit profile, session, bookings, reports, wallet, home-overview loading | same recovery pattern |
| 379 | Home glance booking/wallet/updates retries | tools + draft |
| 380 | Payment-reference Copy / Email / wallet | `LinkKeyboardGroup` |
| 381 | Wallet pending/cancelled follow-ups | `LinkKeyboardGroup` |
| 382 | Pricing wallet copy:** Sign-in shows existing history now; never starts top-up; recharge stays paused | Applied the fix described in the UX improvement loop. |
| 383 | Auth `reason=auth`:** Signing in does not open No Timer or recharge (Send code still unconstrained) | Applied the fix described in the UX improvement loop. |
| 384 | `src/features/tools/PaidTool.tsx` | Payment-help link and clearer meanwhile path |
| 385 | `src/app/(customer)/wallet/recharge/page.tsx` | Explicit no-charge copy, payment-status/help next steps |
| 386 | `src/features/wallet/Wallet.tsx` | Zero-balance and empty-transaction CTAs + payment-status link |
| 387 | Wallet load / zero balance | recovery CTAs use `LinkKeyboardGroup` (Arrow / Home / End / Escape) |
| 388 | Cancelled payments | “Why a payment can fail” is in the wallet arrow-nav set (`data-wallet-tx`) |
| 389 | Pricing policy | related links in a keyboard nav group (incl. coins help) |
| 390 | Clipboard copy fail | payment reference uses `role="alert"` when copy is blocked |
| 391 | Auth OTP/return:** Pause banner stays through verify; `/bookings/new` & recharge returns are humanized as waitlist pages, not unlocks. | Applied the fix described in the UX improvement loop. |
| 392 | Download intro:** Website No Timer + recharge stay paused; Android timed packs are in-app only. | Applied the fix described in the UX improvement loop. |
| 393 | Payment reference | Escape dismisses copy success/failure status |
| 394 | Chat grace confirm adds wallet + tools/draft; end confirm adds tools/draft | Applied the fix described in the UX improvement loop. |
| 395 | Media grace confirm adds wallet + tools/draft; leave/end confirms add tools/draft | Applied the fix described in the UX improvement loop. |
| 396 | `d:\Projects\pandittalk-website\src\features\wallet\Wallet.tsx` | Copy says “Contact support” but links to `/help`. **Fix:** Link to `/contact` (keep a separate help-centre link if needed). |
| 397 | `d:\Projects\pandittalk-website\src\app\(customer)\wallet\recharge\page.tsx` | Metadata is title-only. **Fix:** Add description stating recharge is paused / no charge on this page. |
| 398 | `d:\Projects\pandittalk-website\src\app\(customer)\wallet\payment-status\page.tsx` | Metadata is title-only. **Fix:** Add description guiding users to refresh wallet / not retry payments. |
| 399 | Pricing policy | Coins vs INR, paused-purchase status, “will not invent” list + notify/help links |
| 400 | `src/app/(public)/how-it-works/page.tsx` | Intro “Before you pay, review…” implies payment is available. · Soften intro to match paused purchases. |
| 401 | `src/features/account/HomeOverview.tsx` | Wallet/updates “unavailable” has no retry. · Add Try again (or surface `reload`) next to those lines. |
| 402 | Payment reference | Escape leaves the field; clearer clipboard-blocked copy |
| 403 | Payment reference | Escape returns focus to Copy |
| 404 | Wallet transactions | Arrow / Home / End between rows |
| 405 | `src/app/(customer)/wallet/recharge/page.tsx`** + **`payment-status/page.tsx` | Both render generic `Wallet` only; no recharge CTA, return status, or pending-payment UX. Fix: dedicated status copy + deep-link to help / notify when recharge opens. |
| 406 | `src/app/(customer)/layout.tsx` | Only `robots: noindex`; every customer route shares the site default title. Fix: per-page `metadata.title` (Wallet, Bookings, Chat, etc.). |
| 407 | `src/features/wallet/Wallet.tsx` | Missing `id="main-content"` (skip lands on wrapper only). Fix: add on `<main>` like SessionPage/home. |
| 408 | `src/features/bookings/BookingViews.tsx` (`BookingList`) | Error path is text-only, no Retry. Fix: add reload button like Wallet/Reports. |
| 409 | `src/components/site/SiteHeader.tsx` | Signed-in desktop shows Account + My home but not Notifications/Wallet. Fix: one “Updates” or wallet shortcut when unread/balance matters. |
| 410 | Wallet recharge/payment-status pages (#2) | Applied the fix described in the UX improvement loop. |
| 411 | `src/features/sessions/MediaRoom.tsx` + `ChatRoom.tsx` | “Request eligible grace refund” fires immediately with no confirm and no eligibility explanation. **Fix:** Confirm dialog + short “only if grace window applies; check wallet after” copy before emit. |
| 412 | `src/app/(customer)/wallet/payment-status/page.tsx` | Static advice only; ignores payment/order query params; no live status. **Fix:** Read reference from query, deep-link refresh wallet/tx, or say clearly this is guidance-only with CTA to wallet. |
| 413 | `src/features/wallet/Wallet.tsx` | Always shows INR beside coins; coin-only/refund rows can show `₹0.00` and confuse. **Fix:** Hide INR when `amountInr === 0` or show “coins only”. |
| 414 | `src/app/(customer)/home/page.tsx` | Hub cards don’t surface unread count / next booking / balance (conversion dead-end after login). **Fix:** Pull unread + next resumeable booking + coin balance into Overview. |
| 415 | `src/app/(public)/pricing/page.tsx` | CTAs to `/wallet` and `/bookings` force login without saying so. **Fix:** “Sign in to view…” or use `returnTo` copy on the buttons. |
| 416 | Notify links | Customer/deep pages no longer dump to `/#booking-availability`; they go to `/how-it-works#booking-availability-how` (home, wallet, bookings, directory, guidance, download). |
| 417 | Wallet recharge + paid-tool lists wrapped in `LinkKeyboardGroup` | Applied the fix described in the UX improvement loop. |
| 418 | Notification preferences:** Saving prefs does not open booking/recharge; waitlists called out as separate. | Applied the fix described in the UX improvement loop. |
| 419 | Wallet lede:** States recharge paused and that opening the page never starts a top-up. | Applied the fix described in the UX improvement loop. |
| 420 | OfferNotice / payment mailto / cancel / review / reports:** Explicit never-charge / pause honesty on those surfaces. | Applied the fix described in the UX improvement loop. |
| 421 | Wallet toolbar and pending/cancelled transaction follow-ups now include Prepare a draft | Applied the fix described in the UX improvement loop. |
| 422 | Payment-status clusters use shared `EscapeBlurNotice` with Escape blur + draft on success/failed/waiting/unknown | Applied the fix described in the UX improvement loop. |
| 423 | Recharge waitlist keeps attributed `source` and adds tools/draft alternatives | Applied the fix described in the UX improvement loop. |
| 424 | Payment status | reference always shown (copy / select / mailto) |
| 425 | Home overview | recharge pause link even with non-zero balance |
| 426 | Help empty search | payment help; contact shortcuts → account/payment/grievance |
| 427 | Pricing / About / Trust | payment help and CTA rows keyboard-grouped |
| 428 | Payment status / story | `noindex` for private customer surfaces |
| 429 | Home overview | Zero-balance link to recharge updates |
| 430 | Story / Wallet / Profile | Pause notice; focus wallet load errors; focus first invalid profile field |
| 431 | Expert empty reviews / Reading / payment status / error / HelpSearch / a11y docs / zodiac | Recovery links, disclaimer, pricing path, tools escape hatch, empty-search paths, large-text notes, wrap-safe buttons |
| 432 | `d:\Projects\pandittalk-website\src\features\reports\Reports.tsx` | empty state missing notify/booking link; add “Notify when booking opens” like wallet/bookings. |
| 433 | Payment reference | Clipboard failure shows selectable fallback + clear status. |
| 434 | Chat/Media grace refund | status + wallet/booking/help CTAs after submit; ~90s grace copy clarified |
| 435 | Payment reference copy | busy/disabled + “Copying…” feedback |
| 436 | Payment status page | success / pending / failed hint paths with clearer next steps |
| 437 | Booking cancel | wallet / refresh / contact CTAs; duration copy not a live countdown |
| 438 | Empty wallet transactions | same + free tools / draft / booking-update paths |
| 439 | Payment status unrecognized + no-provider clusters | Implemented: Payment status unrecognized + no-provider clusters |
| 440 | Payment status | unrecognized `?status=` honesty; waiting notice status |
| 441 | Home overview | toolbar as keyboard group (Refresh / free tools / draft); wallet, updates, reports, empty-status rows get `aria-describedby` |
| 442 | Customer home | wallet-pause recharge / wallet / booking-updates hint |
| 443 | Wallet recharge | paused next-steps Arrow / Home / End (`website_wallet_recharge` source kept) |
| 444 | Payment status with no reference | payment help + contact as primary recovery |
| 445 | Payment status (no ref):** Wallet / draft / free-tools recovery | Applied the fix described in the UX improvement loop. |
| 446 | Wallet transactions:** Descriptive `aria-label`s | Applied the fix described in the UX improvement loop. |
| 447 | Wallet:** Dropped nested focusable rows; arrow nav targets payment links / settled rows; empty + footer use `LinkKeyboardGroup`. | Applied the fix described in the UX improvement loop. |
| 448 | Fix wallet recharge/payment-status UX | Completed in the autonomous UX loop. |
| 449 | wallet recharge/payment-status pages | Implemented during the UX 500+ goal loop. |
| 450 | Wallet main-content id | Implemented during the UX 500+ goal loop. |
| 451 | wallet recharge pages | Implemented during the UX 500+ goal loop. |
| 452 | Wallet/Profile contact links | Implemented during the UX 500+ goal loop. |
| 453 | guidance/wallet metadata | Implemented during the UX 500+ goal loop. |
| 454 | payment-status allowlist | Implemented during the UX 500+ goal loop. |
| 455 | Wallet recharge copy | Implemented during the UX 500+ goal loop. |
| 456 | Wallet recharge submit | Expose aria-busy during recharge initiation |
| 457 | Wallet transactions empty | Empty CTA linking to /wallet/recharge with honest copy |
| 458 | Payment status unknown/waiting | Recovery CTAs: free tools, contact, retry |
| 459 | Wallet/recharge/payment-status titles | Titles and descriptions for trust |
| 460 | Wallet recharge/payment-status UX | Rebuild recharge and payment-status honesty/recovery |
| 461 | Wallet main-content id missing | Add main-content landmark id |
| 462 | payment-status query allowlist | Allowlist payment-status query params |
| 463 | wallet INR hide zero | Hide misleading zero INR displays |
| 464 | HomeOverview wallet field bug | Fix HomeOverview coinBalance field bug |
| 465 | Payment status success/pending/failed CTAs | Status-specific recovery CTAs including free tools |
| 466 | Payment status honesty unrecognized | Unrecognized payment states use honest unknown copy |

## Auth / OTP (193)

| # | Issue | Fix |
|---|---|---|
| 467 | SocialSignIn | Apple button `aria-busy` (Send code still unconstrained) |
| 468 | Auth sign-in error recovery | keyboard hint (Send code still unconstrained) |
| 469 | `/bookings/new` is a confusing duplicate | `src\app\(customer)\bookings\new\page.tsx` renders same `GuidanceFlow` as public `/guidance/start`, behind auth, no metadata. **Fix:** Redirect `/bookings/new` → `/guidance/start` (or add clear “draft only” metadata + banner). |
| 470 | Security headers missing | `middleware.ts` only sets cache + robots; `next.config.ts` empty. **Fix:** Add CSP/frame/options/referrer/permissions headers in `next.config` `headers()` (or middleware) plus a short “secure connection” note on auth if you surface failures. |
| 471 | `/bookings/new` not in sitemap (auth)** but may be linked from old app deep links. **Fix:** Document redirect; add middleware-friendly message if hit logged-out. | Applied the fix described in the UX improvement loop. |
| 472 | `pricing/page.tsx` | Login CTAs add `reason=auth`; link to pricing policy; Open Graph metadata |
| 473 | `ToolForm.tsx` | Palm Clear resets file input; lock form while compressing; focus errors; named consent checkboxes |
| 474 | `verify-otp` / `link-phone` | Soft redirects preserve safe `returnTo` + `reason` |
| 475 | `AuthForm.tsx` | Age/T&C consent required before “Send code” (matches social gate) |
| 476 | `src/app/(auth)/login/page.tsx` | Login metadata is only `title` + `robots`; no description (poor bookmarks/share previews when undoing noindex locally). — Add a clear `description` (keep `noindex`). |
| 477 | `src/app/sitemap.ts` | Dead `path.startsWith('/authors/')` priority branch; authors are never emitted. — Remove the `/authors/` clause (or actually emit author URLs). |
| 478 | `src/features/account/Account.tsx` (`PhoneChange`) | `+91` prefix is `aria-hidden` and the label omits “(+91)” (unlike AuthForm), so SR users may miss country code. — Put “(+91)” in the visible label text. |
| 479 | `src/features/account/Account.tsx` (`PhoneChange`) | OTP step shows `+91 {phone}` using raw input, so `+9198…` becomes `+91 +9198…`. — Display the normalized national number only. |
| 480 | `src/features/account/Account.tsx` (`PhoneChange`) | After verify, `logout()` immediately `location.assign('/login')`, so the success UI/status never sticks. — Logout with a query flash (`?phoneUpdated=1`) or delay redirect until status is announced. |
| 481 | `src/app/(journal)/articles/[slug]/page.tsx` | `authorHref` uses `authorPanditId` (`/authors/…`) while ConsultCta `authorId` uses `authorProfile?.id` (`/pandits/…`); IDs can diverge. — Drive both links from one authoritative pandit/expert id. |
| 482 | `src/components/articles/ConsultCta.tsx` | “More by {author}” goes to `/authors/…` while “Meet …” goes to `/pandits/…`, splitting one person across two destinations without explanation. — Prefer one profile URL, or label “Journal author page” vs “Consultation profile”. |
| 483 | `src/app/globals.css` | `.auth-page a { display: inline-flex; min-height: 44px }` blows up inline Terms/Privacy links inside the consent line on narrow screens. — Limit the 44px rule to standalone text-links/buttons, not nested checkbox copy links. |
| 484 | `src/app/(journal)/authors/[id]/page.tsx` | Author pages are linked from articles/ConsultCta but omitted from the sitemap (orphans for crawlers). — Include author URLs in the sitemap, or stop linking them as primary author destinations. |
| 485 | Social sign-in failure:** Adds account-access help + contact beside phone Send code / tools / draft. | Applied the fix described in the UX improvement loop. |
| 486 | Journal author | waitlist under CTAs (`website_journal_author`) |
| 487 | Phone change Send/Verify | tools/draft + skip hints |
| 488 | Auth returnTo notice | Escape blur (Send code still unconstrained by consent) |
| 489 | Large-text stacking | auth, filters toolbar, glance, tool/guidance/info-column rows |
| 490 | Social sign-in | missing consent focuses the consent checkbox |
| 491 | A11y changelog bullet updated; Auth Send code unconstrained; NotifyOpenForm/OfferNotice still need `source` | Applied the fix described in the UX improvement loop. |
| 492 | Notify / tools / share / social | guidance waitlist copy; tool alert `aria-label`; article URL Escape; social status only when messaging |
| 493 | `src/features/auth/AuthForm.tsx` (~L97) | Applied the fix described in the UX improvement loop. |
| 494 | `src/features/auth/AuthForm.tsx` (~L102–104) | Applied the fix described in the UX improvement loop. |
| 495 | `src/app/(journal)/authors/[id]/page.tsx` (~L60–62) | Applied the fix described in the UX improvement loop. |
| 496 | ProfileForm Skip `returnTo` | Applied the fix described in the UX improvement loop. |
| 497 | AuthForm OTP wipe + consent gate | Applied the fix described in the UX improvement loop. |
| 498 | Consult CTA / author page | “Meet …” → **View … profile**; Play Store note that app timed booking ≠ website No Timer. |
| 499 | `src/features/experts/ExpertDetail.tsx` | “Read published articles” always links to `/authors/{id}` even when empty; gate on author articles or soft-empty. |
| 500 | `src/features/auth/SocialSignIn.tsx` | Google is a two-step UX (custom button → GSI button appears); label first click as “Choose Google account” or auto-click rendered button. |
| 501 | `src/features/auth/SocialSignIn.tsx` | Buttons disabled when `!consent` with no visible reason next to them; add helper text under the buttons. |
| 502 | `src/features/auth/SocialSignIn.tsx` | Status message lacks a stable live region when empty; keep `aria-live="polite"` container always mounted. |
| 503 | `src/app/(auth)/verify-otp/page.tsx` + `AuthForm.tsx` | Route title is “Verify your phone” but UI always starts at phone entry; deep links never open OTP step. |
| 504 | `src/app/(auth)/link-phone/page.tsx` + `AuthForm.tsx` | Same: “Complete sign-in” never enters pending/link-phone mode from the URL/token. |
| 505 | `src/features/auth/AuthForm.tsx` | Failed validation doesn’t set `aria-invalid` on phone/OTP fields or move focus to the error. |
| 506 | `src/features/sessions/SessionPage.tsx` | Back link “← Booking details” may miss 44px touch outside `.auth-page` styles; give it `min-height: 44px`. |
| 507 | `src/app/sitemap.ts` | Missing help article slugs and `/authors/{id}` (journal authors never discoverable via sitemap). |
| 508 | `src/app/robots.ts` | Disallows auth/customer paths but not `/authors` admin-like empties; more importantly **host** strips protocol (`host: SITE_URL.replace(...)`) which can emit invalid robots host. |
| 509 | Empty states | journal author empty is a bare `<p>` (`authors/[id]/page.tsx`) vs rich `journal-empty` on articles index—align empty patterns. |
| 510 | `src/components/articles/ArticleChrome.tsx` + `articles/page.tsx` / `authors/[id]/page.tsx` | **Nested `<main id="main-content">`** (layout wraps another main); change Chrome to `<div class="journal">` or drop inner mains. |
| 511 | `src/components/articles/ConsultCta.tsx` | `authorName.split(' ')[0]` breaks multi-word/Hindi names; reuse `expertFirstName`-style salutation stripping. |
| 512 | Author empty | Booking-updates recovery link |
| 513 | Author journal empty | live status region + clearer next steps |
| 514 | For-pandits validation | field-level `aria-invalid`, focused status alerts, consent message |
| 515 | Review authenticity | Broader seed/placeholder name+comment filters; drop anonymous rating-only rows |
| 516 | SocialSignIn | Google group label + hint when consent is still unchecked |
| 517 | PaidTool / home empty / download / author / a11y docs | Draft CTA; free-tool path; iOS waitlist SR status; avatar sizing; Escape/FAQ/waitlist notes documented |
| 518 | `d:\Projects\pandittalk-website\tests\ui\fixtures.ts` vs `d:\Projects\pandittalk-website\playwright.config.ts` | Cookie default origin is `:3100` while Playwright `baseURL` is `:3000`, so auth cookies often never attach. — Align fixture cookie URL with `baseURL` / `UI_BASE_URL`. |
| 519 | profile-setup?returnTo=…`, but “Save and continue” never navigates; they stay on setup. — After successful save on setup, `location.assign(safeReturnTo(returnTo): | '/home')`. |
| 520 | `d:\Projects\pandittalk-website\src\features\account\Account.tsx` (`PhoneChange`) | After phone verify, UI says sign in again but never clears the old session cookie. — Call `logout()` (or clear session) before linking to `/login`. |
| 521 | `d:\Projects\pandittalk-website\src\features\auth\SocialSignIn.tsx` | “Continue with Google” only mounts the GSI button; users must click twice. — Auto-render the GSI button when consent+config are ready, or label the first click as “Show Google options.” |
| 522 | `d:\Projects\pandittalk-website\src\features\auth\SocialSignIn.tsx` | Apple button never shows a busy label (Google does “Preparing Google…”). — Mirror busy text: “Continuing with Apple…”. |
| 523 | `d:\Projects\pandittalk-website\src\lib\api\client.ts` | After failed session refresh on 401, callers only see an error; no sign-in redirect. — On unrecovered 401, redirect to `/login?returnTo=…&reason=auth`. |
| 524 | `d:\Projects\pandittalk-website\src\app\robots.ts` | Disallows auth/account paths but not `/join-as-pandit` (legacy) or soft-duplicate `/expert(s)/` crawl noise. — Disallow legacy auth/join/expert aliases (or rely on redirects + explicit disallow). |
| 525 | `d:\Projects\pandittalk-website\src\app\(legal)\delete-account\page.tsx` | “Open the protected deletion flow” sends signed-out users to a hard login redirect with no on-page warning. — State “You’ll need to sign in” and link `/login?returnTo=/account/delete&reason=reauth`. |
| 526 | `d:\Projects\pandittalk-website\src\app\(public)\how-it-works\page.tsx` | “Manage your story” points at `/account/story` for anonymous readers → abrupt auth wall. — Link `/login?returnTo=/account/story&reason=auth` (or explain sign-in first). |
| 527 | Support email | backend expert auth copy → `admininfo@pandittalk.com` (matches website). |
| 528 | How it works · step 04 | existing bookings only + sign-in CTA. |
| 529 | Auth OTP errors | Resend / different number / booking updates in recovery (Send code still unconstrained by consent) |
| 530 | SocialSignIn | Errors/status focus with alert roles; clarifies phone Send code needs no consent |
| 531 | Apple sign-in | row uses `LinkKeyboardGroup` (consent still never blocks Send code) |
| 532 | `d:\Projects\pandittalk-website\src\app\robots.ts` vs `sitemap.ts` | `/authors/[id]` is crawlable and linked from articles but never emitted in `sitemap.xml`. **Fix:** Include author URLs from article/sitemap API (or disallow authors in robots if intentional). |
| 533 | `d:\Projects\pandittalk-website\src\app\sitemap.ts` | Lists `/delete-account` as a public marketing URL while the page is an auth gate into `/account/delete`. **Fix:** Keep in sitemap only if intentional; otherwise prefer linking from account/privacy and lower priority / noindex. |
| 534 | Dashboard login | same support inbox; “approved” not unverified “verified” |
| 535 | Author empty | Draft + profile recovery when a Pandit has no articles yet |
| 536 | Chat / media rooms | Connecting empty-state honesty; media errors focus + join/sign-in help |
| 537 | ExpertDetail | removed duplicate notify copy; `reason=auth` on sign-in; `text-link` affordance |
| 538 | Soft-redirect honesty | `reason=auth` on guidance + PaidTool login links |
| 539 | `d:\Projects\pandittalk-website\src\app\(customer)\layout.tsx` | Redirect is only `?returnTo=…`; add `reason=auth` (or similar) so login can explain why the user was sent there. |
| 540 | `d:\Projects\pandittalk-website\src\features\auth\AuthForm.tsx` | `destination` is set from `returnTo` but never shown; add a status banner when `destination !== '/home'` (“After sign-in you’ll return to …”). |
| 541 | `d:\Projects\pandittalk-website\src\app\(journal)\layout.tsx` + article pages | Listing/authors use `<main id="main-content">` while `[slug]` uses `<article>`; standardize one landmark so skip never misses and you don’t double-`<main>` if chrome grows. |
| 542 | `d:\Projects\pandittalk-website\tests\ui\journeys.spec.ts` (OTP / palm) | `getByRole('alert')` collides with `#__next-route-announcer__`; scope to `.error[role=alert]` or `getByText`. |
| 543 | Social sign-in | Status scrolls into view; Escape dismisses errors and restores focus |
| 544 | Phone change | Invalid number focuses the phone field; Escape clears status back to phone/OTP |
| 545 | Author profile + empty articles | hints (OfferNotice `source` kept) |
| 546 | Cookie policy | signed-out clarity + sign-in for privacy controls |
| 547 | SocialSignIn | Apple consent hint; Send code still unconstrained |
| 548 | Auth eyebrow + SocialSignIn | private-space framing; trimmed redundant consent spam (Send code still unconstrained) |
| 549 | OTP fields (login + phone change):** Escape clears the code. | Applied the fix described in the UX improvement loop. |
| 550 | Account pause/shortcuts + phone verify | skip notes; verify hint lists tools/draft |
| 551 | Accessibility changelog updated; Auth Send code still unconstrained; skip stays `#site-content`; NotifyOpenForm/OfferNotice still require `source` | Applied the fix described in the UX improvement loop. |
| 552 | Reports / Auth / Account / prefs / phone / delete mains announce busy | Applied the fix described in the UX improvement loop. |
| 553 | Robots still lists dead auth paths | Applied the fix described in the UX improvement loop. |
| 554 | Author “Meet this Pandit” assumes author id === expert id | Applied the fix described in the UX improvement loop. |
| 555 | Guidance public page “Your existing bookings” with no sign-in framing | Applied the fix described in the UX improvement loop. |
| 556 | SocialSignIn | keyboard hint notes consent never blocks Send code |
| 557 | ConsultCta honesty | “Explore Pandits” when no author profile; “Prepare a draft” label |
| 558 | Author pages | Play Store vs iPhone waitlist split (no fake “the app” for iOS) |
| 559 | Auth consent help | clarifies consent gates verify only; Send/resend code never blocked by it |
| 560 | Phone-updated sign-in row + footer bottom support/policy links | `LinkKeyboardGroup` |
| 561 | `src/app/(public)/tools/page.tsx` | Saved-reports sign-in CTA + notify form for paused purchases |
| 562 | `src/components/site/SiteHeader.tsx` | Signed-out menu lists both “Sign in” and a full-width Sign-in button; remove the duplicate text link. |
| 563 | `src/components/articles/ConsultCta.tsx` | Body says full `authorName` but CTA uses `expertFirstName`; align “More by …” / prose with the short name used on the button. |
| 564 | `src/features/auth/SocialSignIn.tsx` | After consent + initialize, call `google.accounts.id.prompt()` (or render the GSI button immediately) so users don’t need a second “Continue with Google” → extra button click. |
| 565 | `src/app/(auth)/verify-otp/page.tsx` + `AuthForm.tsx` | `/verify-otp` renders blank login; deep-link `?phone=` / OTP step (and optional `returnTo`) so SMS / app handoffs land on verify UI. |
| 566 | `src/app/(auth)/link-phone/page.tsx` + `AuthForm.tsx` | Same shared form; `/link-phone` never enters pending/social-complete mode from the URL. |
| 567 | `src/features/auth/AuthForm.tsx` | After OTP, `hasProfile === false` goes to `/profile-setup` and drops `returnTo`; append `?returnTo=` through setup. |
| 568 | `src/lib/api/security.ts` (`safeReturnTo`) | Disallows `/articles`, `/help`, `/download`, etc.; post-login from public CTAs always dumps to `/home`. |
| 569 | `src/components/articles/ConsultCta.tsx` / authors page | Same external Play Store link pattern. |
| 570 | `src/app/(journal)/authors/[id]/page.tsx` | Author avatar `alt=""`; use `alt={data.author.name}` (decorative only if name is also in an adjacent image role). |
| 571 | `src/features/auth/SocialSignIn.tsx` | Google button container is `hidden` until consent; when shown after click, no `aria-live` announcement beyond text—announce “Google button ready” and move focus into `googleBox`. |
| 572 | `src/app/sitemap.ts` | Expert `/authors/{id}` and `/pandits/{id}` both at 0.6; prefer pandit profile slightly higher than author listing. |
| 573 | Social / auth status | Escape dismisses non-blocking status messages |
| 574 | Accessibility changelog updated; Auth Send code still unconstrained; NotifyOpenForm/OfferNotice still require `source` | Applied the fix described in the UX improvement loop. |
| 575 | SocialSignIn: Google needs a prep click before the real button | Render the GSI button as soon as consent is checked |
| 576 | AuthForm: Terms/Privacy `target="_blank"` links lack “opens in a new tab” | Add the same `sr-only` pattern used on download/for-pandits |
| 577 | Author empty articles | Focus + Escape leave; tools recovery; draft does not notify/charge |
| 578 | Google Play CTAs | Author + ConsultCta: “Android app…” (not “Continue”), timed in-app note kept |
| 579 | `d:\Projects\pandittalk-website\src\app\sitemap.ts` | Maps every expert id to `/authors/{id}`, which soft-404s when the author API has no matching journal author. **Fix:** Emit `/authors/` only for real author ids (or drop author URLs from the expert fetch). |
| 580 | `d:\Projects\pandittalk-website\src\features\experts\ExpertDetail.tsx` | “See journal articles by this Pandit” always links to `/authors/{expert.id}` and can 404. **Fix:** Link only when an author page exists, or point to `/articles` with a clear empty state. |
| 581 | `d:\Projects\pandittalk-website\src\features\auth\AuthForm.tsx` | “Send code” is disabled until Terms/Privacy consent is checked, blocking OTP before any account is created. **Fix:** Require consent only on verify / social complete, not on `request-otp`. |
| 582 | `d:\Projects\pandittalk-website\src\app\(journal)\authors\[id]\page.tsx` | Play Store “Continue in the app” link likewise missing `noopener` / new-tab. **Fix:** Add `target="_blank" rel="noopener noreferrer"`. |
| 583 | `d:\Projects\pandittalk-website\src\features\auth\AuthForm.tsx` + phone fields | Visible `+91` prefix is `aria-hidden`, so AT users may miss country code. **Fix:** Expose “+91” in the label / `aria-describedby` (keep visual prefix). |
| 584 | `d:\Projects\pandittalk-website\src\app\(journal)\authors\[id]\page.tsx` | Author avatar uses `alt=""` while the name is not associated as the image’s accessible name. **Fix:** Use `alt={data.author.name}` (or mark decorative only if name is immediately adjacent and sufficient). |
| 585 | `d:\Projects\pandittalk-website\src\app\(auth)\verify-otp\page.tsx` + `link-phone\page.tsx` | Separate URLs render the same `AuthForm` as `/login` with no step deep-link, so shared links look broken. **Fix:** Redirect both to `/login` (or read `?step=` and open OTP/phone UI). |
| 586 | `src/features/account/Account.tsx` (`PhoneChange`) | OTP input missing `aria-invalid` / describedby. · Add help id + `aria-invalid` like login OTP. |
| 587 | `src/features/auth/AuthForm.tsx` | “Send code” works before Terms/age consent. · Require consent before requesting OTP. |
| 588 | `src/app/(journal)/authors/[id]/page.tsx` | Fallback eyebrow “Pandit Talk expert” is SEO leftover. · Use “Author” / specialty only. |
| 589 | `src/app/(journal)/authors/[id]/page.tsx` | Profile CTAs lack a booking-paused honesty line. · Add the same short notice used on pandit profiles. |
| 590 | `src/app/sitemap.ts` | `/authors/:id` pages never enter the sitemap. · Include author URLs like pandit profiles. |
| 591 | Social sign-in | clears “accept terms” error once consent is checked (Send code still unconstrained) |
| 592 | `src/features/account/Account.tsx` (`PhoneChange`) | Free-text phone vs AuthForm `+91` prefix. Fix: reuse same phone field pattern. |
| 593 | `src/features/tools/PaidTool.tsx`** + detailed/monthly pages | No page titles; “Open saved reports” for guests → login shock. Fix: metadata + signed-out CTA (“Sign in to view reports”). |
| 594 | `src/features/pandits/PanditApplicationForm.tsx` | Phone is free-text, not Auth-style `+91`. Fix: shared phone control + validation. |
| 595 | `src/features/sessions/socket.ts` + bootstrap route | Soft failure when `BROWSER_SESSIONS_ENABLED`/socket unset becomes generic “Secure session connection is unavailable.” **Fix:** Surface distinct copy for staging/config vs auth expiry so users don’t loop re-login uselessly. |
| 596 | `src/features/account/Account.tsx` (`DeleteAccount`) | UI only soft-links re-login; API rejects if `authenticatedAt` > 5 minutes (`REAUTH_REQUIRED`). **Fix:** On that error, redirect to `/login?returnTo=/account/delete&reason=reauth` with clear copy. |
| 597 | `src/app/(customer)/account/privacy/page.tsx` | Claims “Session storage keeps you signed in”; auth is httpOnly `pt_session` cookie. **Fix:** Say signed-in session cookie / browser session, not sessionStorage. |
| 598 | `src/app/robots.ts` | Disallows `/login` etc. but not `/api/session` specifically (covered by `/api/`). Gap: no disallow for soft auth paths if added later. Stronger issue: customer paths rely on middleware `X-Robots-Tag` while auth relies on page metadata only—inconsistent. **Fix:** Add auth matcher or shared robots metadata helper for all private/auth routes. |
| 599 | `src/middleware.ts` | Sets `Cache-Control: private, no-store` for all matched customer pages (good) but does not cover `/api/auth/*` HTML-less JSON; fine. Real gap: matcher omits nothing critical, but `/experts` redirects are public—OK. **Issue:** No security headers (CSP/Referrer-Policy) here while customer data is sensitive. **Fix:** Add baseline security headers for customer matcher. |
| 600 | `src/app/layout.tsx` | Organization JSON-LD lacks `sameAs`, `contactPoint`, legal name. **Fix:** Add `organizationName`, support email as `ContactPoint`, Play Store / social `sameAs`. |
| 601 | `src/features/auth/AuthForm.tsx` | Terms/Privacy links open same tab mid OTP/social flow and can drop state. **Fix:** `target="_blank" rel="noopener noreferrer"` (+ sr-only “opens in new tab”) or returnTo restore. |
| 602 | `src/features/auth/SocialSignIn.tsx` | “Continue with Google” then injects a second GSI button into `googleBox`—two-step, confusing. **Fix:** Render GSI button up front when consented, or use One Tap/token flow in one click. |
| 603 | `src/app/sitemap.ts` | Still special-cases `/authors/` priority though author soft-404s were removed from listings; dead logic. **Fix:** Drop authors branch; consider raising `/download` / `/for-pandits` if growth pages. |
| 604 | `tsc --noEmit` clean · invariants held (Send code ≠ consent; skip | `#site-content`; OfferNotice/NotifyOpenForm require `source`) |
| 605 | Auth help row adds booking updates (consent still never blocks Send code) | Applied the fix described in the UX improvement loop. |
| 606 | Large-text stacking for help-search / home tiles / session+auth help; customer toolbars stack by 900px | Applied the fix described in the UX improvement loop. |
| 607 | AuthForm **Send code** still consent-free · skip | `#site-content` · OfferNotice/NotifyOpenForm still require `source` |
| 608 | AuthForm:** consent never blocks Send/Resend; verify still requires it; OTP scrolls into view after send | Applied the fix described in the UX improvement loop. |
| 609 | Phone change | verify buttons + help links keyboard-grouped |
| 610 | CSS + a11y changelog | large-text stacking for info-columns / journal-consult / contact-quick / auth-help; accessibility page documents this batch |
| 611 | `d:\Projects\pandittalk-website\src\app\globals.css` | `.phone-field` + default `input` borders stack; set `.phone-field input { border:0; box-shadow:none; border-radius:0 }`. |
| 612 | `d:\Projects\pandittalk-website\src\app\(journal)\authors\[id]\page.tsx` | empty is only a `<p>`; promote to `<h2>` + clearer empty pattern for a11y. |
| 613 | Social sign-in failures | recovery group focuses phone **Send code** (consent still never blocks it) plus tools/draft |
| 614 | Phone change | Focus OTP after send; focus status on errors; clear invalid state while typing. |
| 615 | Pandit application | status alert kept (no double-focus); consent/phone describe status |
| 616 | Journal article | category + author byline hints; related browse adds guidance/tools; empty-related adds free tools |
| 617 | Author profile | free tools in next-steps group (`OfferNotice` `source` kept) |
| 618 | Pandit apply | Consent links Privacy; apply section notes no public profile until review. |
| 619 | Journal empty + author | empty and profile CTAs Arrow / Home / End |
| 620 | Phone change | updated/verify/help hints; Send/Verify `aria-busy` |
| 621 | Social consent on:** Announces social sign-in is available (Send code still unconstrained) | Applied the fix described in the UX improvement loop. |
| 622 | AuthForm:** Invalid phone keeps the live alert but returns focus to the phone field (Send code still unconstrained by consent). | Applied the fix described in the UX improvement loop. |
| 623 | sitemap authors/help | Implemented during the UX 500+ goal loop. |
| 624 | SocialSignIn consent help | Implemented during the UX 500+ goal loop. |
| 625 | AuthForm aria-invalid | Implemented during the UX 500+ goal loop. |
| 626 | sitemap no /authors soft-404s | Implemented during the UX 500+ goal loop. |
| 627 | OTP consent only on verify | Implemented during the UX 500+ goal loop. |
| 628 | for-pandits/ConsultCta/authors Play Store noopener | Implemented during the UX 500+ goal loop. |
| 629 | verify-otp/link-phone redirects | Implemented during the UX 500+ goal loop. |
| 630 | AuthForm returnTo on profile-setup | Implemented during the UX 500+ goal loop. |
| 631 | sitemap authors/priorities | Implemented during the UX 500+ goal loop. |
| 632 | verify-otp redirects | Implemented during the UX 500+ goal loop. |
| 633 | AuthForm returnTo/reauth | Implemented during the UX 500+ goal loop. |
| 634 | ProfileForm Skip returnTo + Suspense | Implemented during the UX 500+ goal loop. |
| 635 | AuthForm phone lock while sent | Implemented during the UX 500+ goal loop. |
| 636 | Legal/download/authors new-tab sr-only | Implemented during the UX 500+ goal loop. |
| 637 | SocialSignIn auto GSI | Implemented during the UX 500+ goal loop. |
| 638 | ProfileForm Skip returnTo | Implemented during the UX 500+ goal loop. |
| 639 | AuthForm phone lock while OTP | Implemented during the UX 500+ goal loop. |
| 640 | legal/download/authors new-tab | Implemented during the UX 500+ goal loop. |
| 641 | guidance sign-in bookings | Implemented during the UX 500+ goal loop. |
| 642 | authors expertExists gate | Implemented during the UX 500+ goal loop. |
| 643 | SocialSignIn Apple button | Expose aria-busy during Apple sign-in |
| 644 | AuthForm Send code / verify | Expose aria-busy during OTP request/verify |
| 645 | Login/verify-otp/link-phone metadata | Auth metadata |
| 646 | AuthForm phone +91 labeling | +91 prefix labeling and validation UX |
| 647 | AuthForm consent gate | Consent required only on verify/social — never blocks Send code |
| 648 | AuthForm returnTo banners | Surface returnTo/reauth reason banners |
| 649 | link-phone redirects | Consistent post-link navigation |
| 650 | SocialSignIn Google auto-render | Auto-render GSI when consent checked |
| 651 | SocialSignIn Apple busy/labels | aria-busy and consent help |
| 652 | Middleware auth reason | Surface auth redirect reason to user |
| 653 | phone-field component | Reusable phone-field UX |
| 654 | AuthForm legal new tab | Legal links open in new tab with sr-only note |
| 655 | profile returnTo | Honor returnTo after profile |
| 656 | phone logout | Clear phone/session correctly on logout |
| 657 | SocialSignIn labels | Accessible SocialSignIn labels |
| 658 | AuthForm phone lock while OTP sent | Lock phone while OTP sent |
| 659 | AuthForm status focus on errors | Move focus to status on auth errors |

## Bookings / sessions (313)

| # | Issue | Fix |
|---|---|---|
| 660 | Media sessions | error recovery gets `aria-describedby` + draft; rejoin/grace rows add free tools; grace/leave/end confirms get keyboard hints |
| 661 | Chat sessions | reconnect help is a keyboard group; leave-ended adds draft/tools; grace/end/leave confirms get hints (+ tools on leave) |
| 662 | Journal ConsultCta | “More ways” adds free tools + booking updates |
| 663 | New booking alternatives | keyboard hint (no charge; NotifyOpenForm keeps source) |
| 664 | Booking detail loading + post-review more-steps | keyboard hints |
| 665 | Accessibility changelog updated; `tsc --noEmit` clean; `newBookingBlock` / `#site-content` / Notify source unchanged | Applied the fix described in the UX improvement loop. |
| 666 | Help slug ≠ sitemap (404s) | `d:\Projects\pandittalk-website\src\app\sitemap.ts` lists `/help/booking-and-cancellation` and `/help/joining-audio-or-video`, but articles are keyed `booking-cancellation` / `joining-audio-video` in `src\app\(public)\help\[slug]\page.tsx`. **Fix:** Align sitemap slugs to the article keys (or rename keys to match sitemap). |
| 667 | Dead QueuePanel | `src\features\sessions\QueuePanel.tsx` has no imports. **Fix:** Delete or mount only on legacy chat-now bookings with clear “unavailable” framing. |
| 668 | Bookings / Account missing main landmark id | `BookingViews.tsx` `BookingList` and `Account.tsx` use `<main className="page">` without `id="main-content"`. **Fix:** Add `id="main-content"` for consistency with skip targets. |
| 669 | Booking times show local TZ raw | `BookingViews.tsx` uses `toLocaleString()` + `resolvedOptions().timeZone` (IANA id). **Fix:** Format with `timeZone: 'Asia/Kolkata'` and label “IST”. |
| 670 | ExpertDetail dual OfferNotice + sticky CTA | form + sticky “draft only” can feel like booking is available. **Fix:** Compact notice; sticky copy “Prepare draft · booking closed”. |
| 671 | `StoryContext.tsx` | Status/error wired into `aria-describedby`; unique share-booking select ids |
| 672 | `ChatRoom.tsx` | Track `connected` in state; drop full-log `aria-live`; inert chrome while confirms open |
| 673 | `sessions/.../{chat,audio,video}/page.tsx` | Private-room descriptions on noindex metadata |
| 674 | OfferNotice** | Optional email doesn’t create a booking or charge. |
| 675 | Session missing/error | free tools + draft recovery paths. |
| 676 | Route error page | booking-updates escape hatch. |
| 677 | Bookings load failure | draft + contact recovery. |
| 678 | Media room errors | booking / join help / contact recovery block. |
| 679 | Download help | draft + booking-updates links. |
| 680 | Account sign-out row | booking-updates link. |
| 681 | Bookings API | `create` refuses new bookings with 503 / no charge (matches website pause) |
| 682 | Instant queue | `joinQueue` refused; join does not create a booking or charge |
| 683 | Reviews website | placeholder comment filter covers softened seed blurbs; completed booking shows already-reviewed honesty |
| 684 | `src/app/(customer)/sessions/[bookingId]/audio/page.tsx` (and video/chat siblings) | No page `metadata.title`, so all join tabs look like the site default. — Export titles like “Audio consultation”, “Video consultation”, “Chat consultation”. |
| 685 | `src/features/sessions/SessionPage.tsx` | Booking reload clears the room via `useApi` data wipe while a session may already be joined underneath after remount risk. — Preserve last booking snapshot while revalidating. |
| 686 | `src/features/sessions/MediaRoom.tsx` | `<audio autoPlay>` is mounted before join with no source, which can confuse AT/device audio routing. — Render/bind the audio element only after a successful join. |
| 687 | Chat drafts persist in `sessionStorage` per booking; Escape clears them | Applied the fix described in the UX improvement loop. |
| 688 | Bookings filter: Escape | All; count is focusable; filtered empty adds draft/Pandits recovery |
| 689 | Missing booking heading is focused with clearer recovery links | Applied the fix described in the UX improvement loop. |
| 690 | Global error | booking-pause note + booking-updates link |
| 691 | Signed-out mobile menu | Booking updates + Prepare a draft |
| 692 | Home FAQ:** First question no longer implies booking is open; answer notes paused No Timer + draft-only prep. | Applied the fix described in the UX improvement loop. |
| 693 | Account story card:** Copy clarifies the note is for a future conversation while bookings stay paused. | Applied the fix described in the UX improvement loop. |
| 694 | Empty article body + empty notifications:** Focusable Escape leave; stronger “not a booking signal / no charge” honesty. | Applied the fix described in the UX improvement loop. |
| 695 | Booking review | rating `aria-describedby` → error id |
| 696 | Reports empty/print + bookings toolbar | skip `#site-content` hints |
| 697 | Reports / notifications / bookings | load/action errors add draft + contact recovery |
| 698 | Session recovery | Try again `aria-busy` + skip `#site-content` hints (missing/load/format/closed/help) |
| 699 | Story share Retry bookings | `aria-busy` + skip; chat-error + legal TOC skip notes |
| 700 | Guidance / sessions / story / readings | booking & privacy notices use `role="status"`; story `enterKeyHint="done"` |
| 701 | How it works | `FocusOnHash` scrolls/focuses `#booking-availability-how` (reduced-motion aware) |
| 702 | Notifications | button types; booking-waitlist escape hatch in empty state |
| 703 | Account / phone / sessions | sign-out + prefs button types; waitlist in account notice; phone “different number” refocus; session retry `type="button"` |
| 704 | BookingViews | list/detail `aria-busy`; pause/empty/shortcuts hints; review Submit `aria-busy` |
| 705 | Booking cancel | Cancel button exposes `aria-busy` |
| 706 | `src/features/bookings/BookingViews.tsx` (`BookingDetail`, ~L95–119) | Applied the fix described in the UX improvement loop. |
| 707 | `src/features/sessions/MediaRoom.tsx` (Leave room button) | Applied the fix described in the UX improvement loop. |
| 708 | HomeOverview bookings error | Applied the fix described in the UX improvement loop. |
| 709 | BookingDetail soft-404 | Applied the fix described in the UX improvement loop. |
| 710 | `/bookings/new` | Replaced silent redirect with an honesty page (no charge, draft + notify + existing bookings escapes); `NotifyOpenForm` uses `source="website_bookings_new"`. |
| 711 | Home story sequence | “Your next conversation” → **When booking opens**. |
| 712 | Chat connect failures | In-page **Retry connection** (reconnect key remounts socket bootstrap). |
| 713 | `src/app/(public)/contact/page.tsx` | No expected response window or what to include (booking ID fields in copy); hurts conversion/support quality. |
| 714 | `src/features/experts/ExpertDetail.tsx` | “Instant availability must be checked separately” is leftover timer/instant language; replace with No Timer / booking-not-open wording. |
| 715 | `src/features/experts/ExpertDetail.tsx` | “legacy offer… not a quote for a no-timer conversation” confuses users (sounds like hidden pricing); replace with clear “bookings not open; no price shown.” |
| 716 | `src/features/experts/ExpertDetail.tsx` | `OfferNotice compact` hides notify signup on the highest-intent page; show notify or link to `#booking-availability`. |
| 717 | `src/features/experts/ExpertDetail.tsx` | Sticky mobile CTA duplicates the aside CTA with no closed-booking microcopy; add “Prepare draft · bookings not open yet.” |
| 718 | `src/features/experts/types.ts` | `price_per_session` / `available_slots_today` still in the public type (leftover offer model); stop treating as UX signals anywhere downstream. |
| 719 | `src/features/sessions/SessionPage.tsx` | Shows “includes {durationMinutes} minutes under your original booking terms” without clarifying legacy vs No Timer; add explicit legacy-booking framing. |
| 720 | `src/features/sessions/SessionPage.tsx` | Loading has no skeleton/`aria-busy` on the main region; add `aria-busy={q.loading}` and a non-text placeholder. |
| 721 | `src/components/articles/ConsultCta.tsx` | “Talk with a Pandit” / Prepare CTAs omit booking-not-open honesty (`OfferNotice`); add compact notice or copy. |
| 722 | Delete account | Pandits/tools recovery; booking-updates link on pre-delete |
| 723 | Contact shortcuts | Mailto body notes booking pause honesty |
| 724 | Session page | error container is the focus target (`tabIndex={-1}`) |
| 725 | Session soft-404 | missing booking rooms get a clear empty state (not a generic error); no fake “open session” path |
| 726 | Chat leave dialog | Escape hint aligned with other session confirms |
| 727 | Contact / trust / profile-setup / delete / tools CTA | booking-pause honesty so users aren’t steered to book or expect charges |
| 728 | Monorepo journal home | notes main-site No Timer bookings aren’t open yet |
| 729 | Bookings conversion | List lede + `newBookingBlock`: this surface does not create a new No Timer booking or charge |
| 730 | Account privacy:** accurate session-storage copy; cleaner delete CTA path | Applied the fix described in the UX improvement loop. |
| 731 | Notifications CTAs** now say “View booking” (they always linked to booking detail, not session/chat). | Applied the fix described in the UX improvement loop. |
| 732 | Contact** shortcut is “Existing booking” with visible pause note (not “Booking question”). | Applied the fix described in the UX improvement loop. |
| 733 | Empty notifications** lead with draft / tools / booking updates; bookings secondary. | Applied the fix described in the UX improvement loop. |
| 734 | `d:\Projects\pandittalk-website\src\features\account\StoryContext.tsx` | Share booking `<select>` lists every booking (cancelled/completed included). — Filter to shareable statuses (e.g. pending/confirmed/in_progress). |
| 735 | `d:\Projects\pandittalk-website\src\features\bookings\BookingViews.tsx` | “Upcoming and active” uses `canResume` only, so past `pending`/`confirmed` still appear. — Also require `startTime` (or end) in the future / not expired. |
| 736 | `d:\Projects\pandittalk-website\src\features\sessions\ChatRoom.tsx` | Socket `error` events surface raw `p.message` to users. — Map through a safe client message (like `safeServiceError`). |
| 737 | `d:\Projects\pandittalk-website\next.config.ts` | `Permissions-Policy` allows `camera=(self), microphone=(self)` on every public route. — Scope AV to `/sessions/*` (or deny by default). |
| 738 | `d:\Projects\pandittalk-website\src\features\bookings\BookingViews.tsx` (`BookingDetail`) | `reviewOnly` with non-completed booking only shows a notice; no clear exit CTA beyond generic refresh. — Add primary “Back to booking” when review isn’t available yet. |
| 739 | Guidance flow | early pause + notify; review step replaces dead “Booking unavailable” with Explore / View bookings + notify. |
| 740 | Pandit sticky CTA | draft primary + “Get a note when booking opens.” |
| 741 | Closed session room | explicit no new booking/charge while No Timer stays paused |
| 742 | NotifyOpenForm default success | signup never charges or creates a booking |
| 743 | Article share | copy/share never notifies a Pandit or creates a booking/charge |
| 744 | Profile (all modes) | pause aside; saving never opens booking or charges |
| 745 | Private story | save/share honesty; sharing needs an existing booking |
| 746 | Download iOS | Explicit App Store-only waitlist copy, dedicated CTA label, link to booking list |
| 747 | Booking badges | Human labels + status tones (pending/ready/live/done/cancelled) |
| 748 | Session leave | Confirm dialogs in ChatRoom and MediaRoom before leaving |
| 749 | ChatRoom send timeout | 20s honesty: draft kept, check-before-resend copy |
| 750 | HomeOverview | Direct “Open {format} session” on next booking |
| 751 | Topic pause notice | Draft help / How booking will work inline Arrow nav (`source` still required) |
| 752 | Private story | pause, form, delete/share confirms, edit/delete, share-empty booking links grouped |
| 753 | Home FAQ footer | help / booking updates / contact inline Arrow nav |
| 754 | `d:\Projects\pandittalk-website\src\features\experts\ExpertDirectory.tsx` | Compact home rows still say “Online” beside “Bookings not open yet”, which contradicts. **Fix:** Hide presence or replace with “Listed · bookings paused” in compact mode. |
| 755 | `d:\Projects\pandittalk-website\.env.example` | `SESSION_SECRET=replace-with-64-hex-characters` with no generation tip; `SOCKET_URL` blank unexplained. **Fix:** Add one-line how-to generate secret and when Socket is required. |
| 756 | `d:\Projects\pandittalk-website\README.md` | Env section omits `SESSION_SECRET`, `BACKEND_URL`, `BROWSER_SESSIONS_ENABLED`; scripts omit `npm run test:ui`. **Fix:** Align README with `.env.example` and `package.json` scripts. |
| 757 | `d:\Projects\pandittalk-website\src\features\experts\ExpertDetail.tsx` | Sticky CTA button says “Prepare a conversation” while meta says “draft only” / bookings paused. **Fix:** Match primary CTA to “Prepare a draft” (same as guidance intent). |
| 758 | `d:\Projects\pandittalk-website\src\components\site\OfferNotice.tsx` + `src\app\(public)\pricing\page.tsx` | Compact `OfferNotice` on pricing links “View service details” → `/pricing` (self-loop) and “Get notified” → `/#booking-availability` while the page already has a notify form. **Fix:** On pricing, drop compact notice or pass a variant without self-link / in-page notify anchor. |
| 759 | Journal footer | `admininfo@pandittalk.com`; legal/trust/contact → main site; booking-pause honesty |
| 760 | Journal empty | Honest empty copy (booking closed); removed decorative mark; editorial + tools CTAs |
| 761 | Notification prefs | Marketing vs public waitlist honesty; booking waitlist link |
| 762 | Session page | Focus moves to missing/wrong-format/ended status |
| 763 | `/bookings/new` | forwards search params to `/guidance/start` |
| 764 | StoryContext | in-page alertdialog for delete/share (Pandit name + booking date); Escape + focus trap |
| 765 | Bookings list | Arrow / Home / End between cards; Escape blurs |
| 766 | Booking status | Escape dismisses success/cancel notices |
| 767 | For Pandits waitlist | success copy now matches practitioner onboarding updates, not customer booking-open mail |
| 768 | Bookings/new | eyebrow “Booking availability” (no longer “New consultation”) |
| 769 | Desktop header | signed-in “Booking paused” cue (parity with mobile) |
| 770 | Monorepo journal CTA | “Prepare a conversation · bookings paused” |
| 771 | Customer home Bookings tile | states new bookings stay paused |
| 772 | `d:\Projects\pandittalk-website\src\lib\api\security.ts` | Still allows `available-slots` / `all-slots` GETs though UI never calls them; tighten allowlist to match paused booking UX. |
| 773 | `d:\Projects\pandittalk-website\src\features\experts\types.ts` | Still types `price_per_session` / `available_slots_today` (leakage risk if someone renders the raw expert); drop from public type or map to omit before UI. |
| 774 | `d:\Projects\pandittalk-website\src\features\experts\types.ts` | Keep UI free of `price_per_session` / `available_slots_today` (currently OK); strip on map so React DevTools/json dumps don’t surface paused pricing/slots. |
| 775 | Contact: booking alternatives + help-centre column | Implemented: Contact: booking alternatives + help-centre column |
| 776 | Refund / Home FAQ / journal empty | booking-update escape hatches |
| 777 | Guidance review | Notify-when-open is primary; browse Pandits / bookings are secondary. |
| 778 | Bookings empty | True empty history focuses the empty panel. |
| 779 | Notifications | CTAs by type (Open session / Open chat / View booking). |
| 780 | Home closing | dropped soft “We’ll open… when it’s ready” promise; states bookings stay closed |
| 781 | Guidance deep links | format/preselected Pandit notes say preference-only / no notify / bookings still closed |
| 782 | Profile setup | skip/complete never creates booking or charge |
| 783 | Bookings filter:** Escape ignores selects; empty state mentions Escape. | Applied the fix described in the UX improvement loop. |
| 784 | Pandit sticky bar:** “Hide this bar for now” (session-scoped). | Applied the fix described in the UX improvement loop. |
| 785 | Booking error/missing recovery + bookings grid | skip `#site-content` hints |
| 786 | Chat leave-ended | booking link + tools/draft + skip hint |
| 787 | PaidTool actions | booking updates link; conversation + actions skip; Escape blur on purchase aside |
| 788 | Chat empty log | Escape blur + booking/tools/draft recovery group |
| 789 | Media session/camera status | Escape blur |
| 790 | NotifyOpenForm | Done/error follow-ups (switch email / contact / how booking) Arrow-nav (`source` still required) |
| 791 | Guidance index | Prepare/Browse/tools + booking-aside hints |
| 792 | Public profile “View your bookings” assumes an account | Applied the fix described in the UX improvement loop. |
| 793 | Bookings list | toolbar keyboard group (Refresh / draft / tools); Escape clears filter from the select; list recovery gets `aria-describedby` |
| 794 | Booking detail | error, missing, cancel status/confirm, session actions, and review-wait clusters all get keyboard hints; cancel confirm uses `aria-busy` |
| 795 | Private story share | booking-load recovery and empty-share rows get keyboard hints |
| 796 | Home overview | refresh describedby; glance booking/retry keyboard hints |
| 797 | Chat grace refund | free tools + draft |
| 798 | Media rejoin / grace | draft recovery paths |
| 799 | Booking cancel / review-wait / shortcuts | tools + draft |
| 800 | Booking detail Refresh | `aria-busy` + “Refreshing…” label |
| 801 | Contact recovery | booking updates; hint before actions |
| 802 | PaidTool notify aside | tools/draft/booking follow-ups |
| 803 | Notifications empty | draft + help recovery paths; clearer booking-paused copy |
| 804 | Guidance start aside (Pandits / tools / booking updates) | `LinkKeyboardGroup` |
| 805 | Chat live controls + grace / leave / end confirms | `LinkKeyboardGroup` |
| 806 | Booking cancel confirm | `LinkKeyboardGroup` |
| 807 | NotifyOpenForm (Pandit/directory):** Success no longer says “when you can book”; states No Timer open + never charges/creates a booking | Applied the fix described in the UX improvement loop. |
| 808 | Guidance draft Pandit step:** “Optional Pandit preference (not a booking)” + empty option won’t notify/book | Applied the fix described in the UX improvement loop. |
| 809 | Mobile signed-out menu:** “Bookings paused” + draft/tools before Sign in | Applied the fix described in the UX improvement loop. |
| 810 | `src/components/site/OfferNotice.tsx` | Optional `source` override + “how booking will work” link |
| 811 | `src/middleware.ts` | `Pragma: no-cache` + session-aware Permissions-Policy (camera/mic allowed on `/sessions`) |
| 812 | Booking detail | cancel status, session actions, and review-not-ready clusters keyboard-grouped |
| 813 | Chat / media grace refund | after submit, status scrolls into view and takes focus |
| 814 | `/bookings/new` tab title:** `New bookings paused` (body still uses `newBookingBlock` / no-charge copy). | Applied the fix described in the UX improvement loop. |
| 815 | Reading closeout:** Pandit help framed as when booking opens; draft meanwhile. | Applied the fix described in the UX improvement loop. |
| 816 | Tools index lede:** “Take it further” gated on No Timer / bookings paused. | Applied the fix described in the UX improvement loop. |
| 817 | Guidance draft:** Step renamed to “No Timer status”; format = preference only, not a booking; review CTA is “Sign in only if you already have a booking.” | Applied the fix described in the UX improvement loop. |
| 818 | Empty home glance:** “No open bookings” now offers draft / tools / booking updates. | Applied the fix described in the UX improvement loop. |
| 819 | For Pandits dashboard:** Approval ≠ seeker bookings while customer No Timer is paused. | Applied the fix described in the UX improvement loop. |
| 820 | How it works / guidance / approach CTAs:** “Prepare a conversation” | draft wording; first-consultation link notes bookings paused. |
| 821 | `src/features/sessions/ChatRoom.tsx` | `toLocaleTimeString()` still has no IST; use `formatIstDateTime` / IST time helper. |
| 822 | `docs/website-plan/07-IMPLEMENTATION-PLAN.md` | Still says create `QueuePanel.tsx` / `session-state.ts`; file is deleted (`git` shows `D`) — update docs to current `ChatRoom`/`SessionPage`/`MediaRoom`. |
| 823 | `src/features/bookings/types.ts` (`calendarText`) | ICS `DTSTART`/`DTEND` are UTC `Z` with no `TZID=Asia/Kolkata`; calendar apps show wrong local time for IST bookings. |
| 824 | `src/features/bookings/types.ts` | ICS `SUMMARY` is generic; include Pandit name for recognition. |
| 825 | `src/app/(public)/download/page.tsx` | Play Store `<a>` lacks `rel="noopener noreferrer"` (and optional `target="_blank"`) for external leave-site clarity. |
| 826 | `src/app/(customer)/home/page.tsx` | Static tiles only; no unread badge / next-booking CTA (header has Updates, home doesn’t)—add one conversion line from notifications/bookings API. |
| 827 | Session wrong-format / not-resumable | Escape blurs heading; draft + free-tools recovery |
| 828 | SiteHeader: Desktop session placeholder is aria-hidden “…” | Use a real `role="status"` “Checking session…” control |
| 829 | ChatRoom: Grace-refund dialog lacks Escape/focus trap (End has both) | Reuse the End-dialog keyboard/focus effect |
| 830 | ChatRoom: Typing indicator always force-scrolls the log | Auto-scroll only when already near the bottom |
| 831 | ChatRoom: Send stays locked forever if the echo never arrives | Add a timeout that unlocks the composer + retry hint |
| 832 | MediaRoom: Grace dialog has no Escape/focus handling | Mirror the end-dialog behavior |
| 833 | MediaRoom: “Leave room” is one click, easy mis-tap | Add a lightweight confirm (like End) |
| 834 | BookingViews: Cancel-booking confirm ignores Escape/focus | Focus first action; close on Escape; restore focus |
| 835 | Bookings empty | True-empty focuses once (no re-steal); copy clarifies pause ≠ upcoming list |
| 836 | Booking session closed | When not resumable: focused notice + review/tools/draft/updates/contact recovery |
| 837 | Private story empty | Pause honesty; booking-updates recovery beside write/draft/tools |
| 838 | Pandit profile eyebrow | “Meet your Pandit” → “Pandit profile · bookings paused” |
| 839 | Directory empty + media pre-join | Contact on empty directory; join help + booking on media device check |
| 840 | Bookings list “Prepare another draft” is a keyboard group with free tools + booking updates | Applied the fix described in the UX improvement loop. |
| 841 | Cancel-booking confirm includes free tools + draft recovery (Escape keeps booking) | Applied the fix described in the UX improvement loop. |
| 842 | Review submit row groups Submit + back to booking + tools + draft | Applied the fix described in the UX improvement loop. |
| 843 | Public delete-done page adds draft + booking updates; notify aside has attributed alternatives (`source` required) | Applied the fix described in the UX improvement loop. |
| 844 | `d:\Projects\pandittalk-website\src\features\bookings\types.ts` | Calendar invite URLs use `https://pandittalk.com/...` (no `www`) vs canonical `SITE_URL`. **Fix:** Build URLs from `SITE_URL` / `absoluteUrl()`. |
| 845 | `d:\Projects\pandittalk-website\src\features\bookings\BookingViews.tsx` | When bookings exist, footer CTA “Prepare another consultation” implies booking is available. **Fix:** Rename to “Prepare another draft” / note that booking is paused. |
| 846 | `d:\Projects\pandittalk-website\src\features\sessions\ChatRoom.tsx` | End-session `role="dialog"` has no focus trap / inert backdrop. **Fix:** Trap Tab inside the dialog and restore focus on dismiss (same pattern as mobile menu Escape). |
| 847 | `d:\Projects\pandittalk-website\src\app\(public)\pandits\page.tsx` | Uses compact OfferNotice with no email capture despite lede pushing “bookings not open.” **Fix:** Embed `NotifyOpenForm` or link to `/#booking-availability` next to the notice. |
| 848 | Our approach | story/boundary/next groups; notify alternatives + booking updates |
| 849 | `src/app/page.tsx` | OG description omits “bookings not open” honesty that meta already has. · Mirror the meta description into `openGraph.description`. |
| 850 | `src/app/layout.tsx` | Sitewide default/OG/Twitter copy still reads like bookings are live. · Add paused-booking honesty to root `description` / OG / Twitter. |
| 851 | `src/features/sessions/ChatRoom.tsx` | Grace-refund dialog has no Escape/focus trap (End dialog does). · Reuse the End-dialog focus + Escape handling. |
| 852 | `src/features/sessions/MediaRoom.tsx` | Confirm dialogs lack a full focus trap; grace has no Escape. · Match ChatRoom dialog a11y pattern. |
| 853 | `src/components/articles/ConsultCta.tsx` | H2 “Talk with a Pandit” implies live booking. · Soften to “Meet {name}” / prepare-draft framing. |
| 854 | `src/features/bookings/BookingViews.tsx` | Cancel confirm isn’t a real dialog (no `role`/Escape/focus). · Make it `role="dialog"` with Escape + focus return. |
| 855 | `src/app/page.tsx` (FAQ JSON-LD) | Answer URLs keep awkward `/#booking-availability` hashes. · Point schema links at `/` or `/pricing` cleanly. |
| 856 | Home overview | focus empty “at a glance” once when there are no bookings |
| 857 | Session wrong format | free-tools recovery path |
| 858 | `src/features/sessions/ChatRoom.tsx` | After send, `pending` stays true until manual clear; draft not cleared on confirmed `newMessage`. Fix: clear/unlock when own message appears in log. |
| 859 | `src/features/sessions/ChatRoom.tsx` | End/refund confirms are plain `.notice`, not `role="dialog"` / focus trap. Fix: modal pattern + Escape to cancel. |
| 860 | `src/features/sessions/ChatRoom.tsx` | Message log `tabIndex={0}` with no auto-scroll to newest. Fix: scroll into view on new messages; prefer focus only when needed. |
| 861 | `src/features/sessions/MediaRoom.tsx` | No “back to booking” link (ChatRoom has one). Fix: add same leave/return link. |
| 862 | `src/features/sessions/MediaRoom.tsx` | `<audio autoPlay>` has no accessible name; remote video empty state not announced. Fix: `aria-label` on audio + live status when Pandit joins. |
| 863 | `src/features/sessions/MediaRoom.tsx` | End confirm same non-dialog pattern as chat. Fix: shared confirm dialog component. |
| 864 | `src/features/bookings/BookingViews.tsx` (`BookingDetail`) | Review comment has no `maxLength` / counter. Fix: cap + live count (parity with story/guidance). |
| 865 | `src/features/sessions/QueuePanel.tsx` | Component never imported; ExpertDetail still mentions “instant availability.” Fix: mount when relevant or remove dead queue UX / soft claims. |
| 866 | `src/features/bookings/BookingViews.tsx` | Filter empty vs true-empty copy is good; filtered empty lacks link to `/#booking-availability`. Fix: add notify CTA when `rows.length === 0`. |
| 867 | `src/app/(public)/download/page.tsx` | iOS “Notify me” → `/#booking-availability` (booking list, not App Store). Fix: dedicated iOS waitlist source or clearer label. |
| 868 | `src/features/sessions/SessionPage.tsx` | When format mismatch, good redirect; when `!canResume`, review link assumes `/review` route works for all completed—OK, but no calendar/download from session shell. Fix: surface booking actions on ended session view. |
| 869 | ChatRoom pending/message ack (#6) | Applied the fix described in the UX improvement loop. |
| 870 | Session confirm dialogs + MediaRoom booking link (#7–11) | Applied the fix described in the UX improvement loop. |
| 871 | `src/features/sessions/ChatRoom.tsx` | End-consultation `role="dialog"` only focuses first button + Escape; Tab can leave the dialog into the page behind. **Fix:** Trap Tab within dialog controls; restore focus on close; optionally set `inert` on background. |
| 872 | `src/features/sessions/MediaRoom.tsx` | End dialog has no Escape handler, no initial focus, no focus restore; copy literally says Escape is unavailable. **Fix:** Match ChatRoom patterns (Escape, focus first control, restore previous focus, Tab trap). |
| 873 | `src/features/sessions/MediaRoom.tsx` | “Join consultation” enabled before device check; mic/cam selects stay empty until Check. **Fix:** Require successful check (or explicit “use system default”) before Join; disable Join until ready. |
| 874 | `src/features/bookings/BookingViews.tsx` | Cancel confirm is an inline notice (not modal); no focus management; easy to miss beside other actions. **Fix:** Use `role="dialog"` + focus/Escape like ChatRoom. |
| 875 | `src/features/account/Account.tsx` (`Preferences`) | Sets `` `${key} saved.` `` but UI always shows “Preferences saved.” **Fix:** Show human label (“Booking reminders saved”) from the preferences map. |
| 876 | `src/app/(public)/guidance/start/page.tsx` | Metadata omits that booking is closed (unlike home). **Fix:** Mention draft-only / bookings not open in description for SEO honesty. |
| 877 | `src/app/(public)/guidance/[topic]/page.tsx` | Strong CTA to prepare draft with no booking-closed notice on-page. **Fix:** Short notice + link to `#booking-availability` beside CTAs. |
| 878 | `src/components/site/SiteHeader.tsx` | `signedIn` starts `null`; signed-in users briefly see Help + Sign in. **Fix:** Hold CTA in neutral/skeleton until session resolves, or default from cookie bootstrap. |
| 879 | `src/features/experts/ExpertDetail.tsx` | Prominently shows “Online now” while bookings closed (directory already softens on compact). **Fix:** Always pair with “Bookings not open yet”; de-emphasize presence. |
| 880 | `src/features/bookings/BookingViews.tsx` | Review form default rating `5` biases scores. **Fix:** Start with empty/required “Choose a rating”. |
| 881 | `src/features/sessions/ChatRoom.tsx` | Message keys `${timestamp}-${senderId}` can collide on same-ms messages → React reuse bugs. **Fix:** Use server message id or include sequence/nonce. |
| 882 | Booking detail | Escape on error / missing; free-tools paths; shortcut keyboard group |
| 883 | Presence copy | Directory + profile sticky CTA consistently say “New bookings paused” (no “book now” implication). |
| 884 | Chat / media error Escape returns focus to composer / session controls (`#chat-composer`) | Applied the fix described in the UX improvement loop. |
| 885 | Guidance index | topic cards + booking aside use Arrow / Home / End / Escape |
| 886 | Bookings / tools / customer-home pause asides keyboard-grouped | Applied the fix described in the UX improvement loop. |
| 887 | Pandit sticky | draft / booking-note / hide keyboard-grouped |
| 888 | MediaRoom:** Ended consultations set `ended` and no longer re-show Join; post-end recovery explains review only after completed. | Applied the fix described in the UX improvement loop. |
| 889 | ChatRoom:** Post-chat CTA is “Review if completed” (not an unconditional “Leave a review”). | Applied the fix described in the UX improvement loop. |
| 890 | Notifications:** Pause honesty | list is not a booking-open signal; links to waitlist/tools/draft. |
| 891 | Pandit application:** Submit copy clarifies no public profile, no customer bookings, no charge. | Applied the fix described in the UX improvement loop. |
| 892 | Home overview:** Session link says “Open existing … (no new charge)”. | Applied the fix described in the UX improvement loop. |
| 893 | MarkdownBody:** Internal links use Next `Link`; empty body adds booking-pause honesty + recovery. | Applied the fix described in the UX improvement loop. |
| 894 | Booking session actions add free tools + draft beside Open session / calendar / join help | Applied the fix described in the UX improvement loop. |
| 895 | List price = checkout | `price_per_session` fixed at **251** (standard chat); seed meta aligned |
| 896 | No fake reviews | placeholder bookings/reviews no longer written on seed |
| 897 | Booking review recalculation (`bookings.service.ts`) | Applied the fix described in the UX improvement loop. |
| 898 | Chat errors auto-focus; session/report missings add draft paths; paid-tool notice links booking updates; account sign-out clarifies session-only | Applied the fix described in the UX improvement loop. |
| 899 | Session recovery | missing / load-error / wrong-format / not-resumable action clusters + session help links use Arrow / Home / End / Escape |
| 900 | MediaRoom dialogs | focus trap, Escape, restore focus, inert background; leave copy clarifies rejoin window |
| 901 | Booking calendar | status confirms IST download after “Add to calendar” |
| 902 | Account privacy | pause row adds tools/draft; notify aside gets keyboard booking alternatives (`source` still required) |
| 903 | Private story | pause and empty states add free tools + booking updates |
| 904 | Disclaimer + 404 | notify asides get keyboard booking/tools/draft alternatives (`source` still required) |
| 905 | `d:\Projects\pandittalk-website\src\features\guidance\state.ts` | `saveGuidanceDraft` has no try/catch and no `clearGuidanceDraft()`; wrap writes and export `sessionStorage.removeItem(draftKey)`. |
| 906 | `d:\Projects\pandittalk-website\src\app\(public)\help\[slug]\page.tsx` | `chat-reconnect` / `refunds-and-complaints` lack primary action links; add Bookings / Contact / Grievance CTAs like other slugs. |
| 907 | Bookings pause + empty | hint order fixed; filtered-empty adds free tools |
| 908 | Home overview | Next booking shows Pandit name; “Retry overview” when any glance call fails. |
| 909 | Home waitlist | `#booking-availability` is a focusable region with `FocusOnHash` |
| 910 | Session page | included duration vs live timer clarified |
| 911 | Closed booking session recovery | hint covering review, tools, draft, support |
| 912 | Chat empty-log recovery | hint for Retry / booking / reconnect / tools / draft |
| 913 | Empty notifications inbox | hint for draft, tools, bookings, prefs, help |
| 914 | Pandit reviews-empty | hint for draft, tools, trust, booking updates |
| 915 | Contact booking-alt, email subjects, recovery rows | Implemented: Contact booking-alt, email subjects, recovery rows |
| 916 | Guidance topic pause | draft help / how booking works / free tools (`NotifyOpenForm` `source` kept) |
| 917 | Presence honesty | Directory/profile no longer say “Offline” / bookable-available; copy clarifies app presence ≠ website booking. |
| 918 | Guidance index | Compact booking OfferNotice + topic list semantics. |
| 919 | 404 / error / download / about / a11y | Clearer recovery paths, draft reassurance, Play Store ≠ booking, Trust link, skip-target docs. |
| 920 | Private story | load / share-booking errors Escape-blur; empty panel + recovery keyboard-grouped; booking select clears with Escape |
| 921 | Bookings list | load-error recovery + empty-state Escape / keyboard group (incl. free tools) |
| 922 | Chat / media | error, grace-refund, and rejoin clusters Arrow / Home / End |
| 923 | Soft-404 shell | Escape on heading + tools/draft/how-booking next to notify |
| 924 | Notifications | error/invalid/empty/prefs hints; invalid recovery links; Mark as read `aria-busy`; booking waitlist shortcut |
| 925 | ChatRoom dialogs:** State, error, helper, jump, typing, post-chat links, grace actions, and leave stay `inert` while confirms are open. | Applied the fix described in the UX improvement loop. |
| 926 | MediaRoom dialogs:** Mute disabled; status/error/camera note and grace links inerted while confirms are open. | Applied the fix described in the UX improvement loop. |
| 927 | Hero conversion honesty + notify path when bookings closed | Completed in the autonomous UX loop. |
| 928 | The hero sells “Find your Pandit” as if booking is next, while No Timer isn’t open—and there’s no notify path. Fixing hero honesty, brand clarity, and a matching notify capture. | Fixed in the UX loop. |
| 929 | Fix ChatRoom pending ack + dialog a11y | Completed in the autonomous UX loop. |
| 930 | ChatRoom pending ack+dialog | Implemented during the UX 500+ goal loop. |
| 931 | MediaRoom booking link+audio label | Implemented during the UX 500+ goal loop. |
| 932 | BookingList retry | Implemented during the UX 500+ goal loop. |
| 933 | ChatRoom/MediaRoom | Implemented during the UX 500+ goal loop. |
| 934 | SessionPage legacy framing | Implemented during the UX 500+ goal loop. |
| 935 | ICS www URLs | Implemented during the UX 500+ goal loop. |
| 936 | booking CTA copy | Implemented during the UX 500+ goal loop. |
| 937 | booking CTA draft wording | Implemented during the UX 500+ goal loop. |
| 938 | ChatRoom grace+end Escape/ | Implemented during the UX 500+ goal loop. |
| 939 | HomeOverview bookings error | Implemented during the UX 500+ goal loop. |
| 940 | BookingDetail 404 | Implemented during the UX 500+ goal loop. |
| 941 | MediaRoom leave/grace/end confirms Escape | Implemented during the UX 500+ goal loop. |
| 942 | ChatRoom/MediaRoom dialog Escape+focus | Implemented during the UX 500+ goal loop. |
| 943 | Booking cancel Escape | Implemented during the UX 500+ goal loop. |
| 944 | ExpertDetail bookings label + public reviews | Implemented during the UX 500+ goal loop. |
| 945 | ChatRoom end-session confirm | Escape closes dialog; focus Keep talking; Tab trap |
| 946 | ChatRoom grace-refund confirm | Escape + focus restore + Tab trap on grace dialog |
| 947 | ChatRoom leave-room confirm | Confirm before leave; Escape/focus safe action first |
| 948 | MediaRoom end-for-everyone confirm | Escape; focus Keep talking; Tab trap |
| 949 | MediaRoom grace-refund confirm | Escape handler + focus management |
| 950 | MediaRoom leave-room confirm | Confirm leave before disconnect/navigate |
| 951 | BookingViews cancel-booking dialog | Escape closes; focus Keep booking first |
| 952 | Bookings list empty | Empty state with explore pandits / prepare draft CTAs |
| 953 | Session chat/audio/video titles | Session-specific titles |
| 954 | Booking calendar ICS times | Correct ICS times + www URLs |
| 955 | Session history times IST | IST-consistent session timestamps |
| 956 | Session privacy framing weak | Clarify session privacy copy |
| 957 | ChatRoom pending ack + dialog a11y | Pending message ack + dialog a11y |
| 958 | BookingList retry missing | Add retry on bookings load failure |
| 959 | Review maxLength missing | Enforce review text maxLength |
| 960 | bookings/new redirect | Redirect/clarify bookings/new entry |
| 961 | ChatRoom focus trap/grace/message keys | Focus trap, grace confirm, stable message keys |
| 962 | MediaRoom device-check/Escape/grace | Device check + Escape + grace dialogs |
| 963 | booking upcoming filter | Upcoming bookings filter correctness |
| 964 | session titles | Correct session page titles |
| 965 | newBookingBlock No coins charged | Honesty: No coins will be charged copy |
| 966 | Chat/media reconnect help | Reconnect help groups with keyboard affordances |
| 967 | ChatRoom focus errors + re-sign-in | Focus errors; auth errors link to re-sign-in |
| 968 | ChatRoom post-end actions | Post-end booking/review/wallet actions |
| 969 | SessionPage format-specific help | Chat reconnect vs audio/video join help |
| 970 | Bookings focus after cancel/review/ICS | Focus status/error after key booking actions |
| 971 | Media sessions error recovery aria-describedby | Error recovery gets aria-describedby + draft/tools |
| 972 | Chat reconnect keyboard group | Reconnect help is a keyboard group |

## Accessibility / keyboard (315)

| # | Issue | Fix |
|---|---|---|
| 973 | Pandit directory | filter toolbar is a keyboard group; load/empty recovery add free tools |
| 974 | ArticleShare | Share/Copy expose `aria-busy` |
| 975 | Android download | free-tools action in keyboard group |
| 976 | Notifications | Focus mark-read failure alerts. |
| 977 | Home overview | `aria-busy` while glance calls load. |
| 978 | Accessibility copy | Documents Escape-on-filters. |
| 979 | Directory filters panel | Clear + tools + draft keyboard group |
| 980 | Prefs / phone Resend | `aria-busy` on saving checkbox + Resend |
| 981 | Empty article body | recovery cluster keyboard hint |
| 982 | Sign-out error recovery | keyboard hint + tools/draft |
| 983 | Prefs pause waitlist + save recovery | keyboard hints |
| 984 | Profile save recovery | keyboard hint |
| 985 | Notifications pause row | keyboard hint |
| 986 | Media consultation-ended | keyboard hint |
| 987 | Tool-form reading error recovery | keyboard hint |
| 988 | Homepage FAQ lacks structure | `src\app\page.tsx` FAQ has no `FAQPage` JSON-LD, no section `id`/`aria-labelledby`. **Fix:** Add schema + labelled section (and optional deep-link ids). |
| 989 | FAQ accordion a11y | `.home-faq-item summary` custom `::after` only; no `name` grouping. **Fix:** Add visible focus styles / `name="home-faq"` if multi-expand is unintended. |
| 990 | Skip link vs page mains | `SiteHeader.tsx` skips to `#site-content` (wrapper), not `#main-content`. **Fix:** Prefer `#main-content` or ensure every route defines one. |
| 991 | Birth date missing IST cue | `ToolForm.tsx` labels time as IST but date as “Birth date” only. **Fix:** Label “Birth date (IST calendar day)” + `aria-describedby`. |
| 992 | `SiteHeader.tsx` | Skip link targets `#main-content` |
| 993 | Guidance notes / date | Escape clears; counts mention it |
| 994 | Guidance format / Pandit | Escape clears selection; directory load error adds directory + contact recovery |
| 995 | Private story | Escape clears draft; load failure adds draft + contact recovery |
| 996 | Pandit application | Escape clears name, email, practice, languages, message; message gets `enterKeyHint` |
| 997 | Directory filters | Escape on topic/language/sort resets defaults |
| 998 | For Pandits `#apply` | re-focuses after bfcache `pageshow` |
| 999 | Accessibility docs | recorded the new keyboard and focus behaviors |
| 1000 | FocusMainHeading | scrolls into view with reduced-motion awareness. |
| 1001 | Tool reading result | focus + scroll honour `prefers-reduced-motion`. |
| 1002 | Account privacy | heading focus via `FocusMainHeading`. |
| 1003 | Accessibility docs | documented the new keyboard, focus, and reflow behaviors. |
| 1004 | `src/app/(public)/for-pandits/ForPanditsClient.tsx` | Dashboard `target="_blank"` link has no screen-reader “opens in a new tab” cue. — Add visually hidden new-tab text (as MarkdownBody does). |
| 1005 | `src/features/pandits/PanditApplicationForm.tsx` | Failed phone submit sets status but not `aria-invalid` on the phone input. — Set `aria-invalid` / `aria-describedby` when validation fails. |
| 1006 | `src/features/tools/Reading.tsx` | Whole reading tree is `aria-live="polite"`, so opening a saved report can dump the entire text to SR users. — Remove live region from static report views; keep live only for in-progress tool results. |
| 1007 | Media rooms autofocus **Rejoin** after leaving | Applied the fix described in the UX improvement loop. |
| 1008 | Journal chips: overflow swipe hint; Escape | Implemented: Journal chips: overflow swipe hint; Escape |
| 1009 | Empty journal category focuses the empty heading | Applied the fix described in the UX improvement loop. |
| 1010 | Phone-change autofocuses the number field on load | Applied the fix described in the UX improvement loop. |
| 1011 | Notifications | alert focus + empty `role="status"` |
| 1012 | global-error | `:focus-visible` rings (no `outline:none`) |
| 1013 | Notifications “all caught up” and unread-empty | tools/draft keyboard recovery |
| 1014 | Horoscope signs | Arrow moves and selects; Escape clears |
| 1015 | Media devices | Escape resets mic/camera to system default |
| 1016 | Customer nav | Escape returns to the current section |
| 1017 | Profile birth fields | validation focuses the invalid date/time input |
| 1018 | Legal tables | Escape blurs the scroll region |
| 1019 | Accessibility docs | noted the new keyboard and focus behaviors |
| 1020 | Pandit Retry / directory Try again | `aria-busy` while reloading |
| 1021 | Notifications error/invalid Try again | `aria-busy` + skip hints (incl. empty) |
| 1022 | Home overview Retry | `aria-busy` + empty/error skip hints |
| 1023 | Notifications / home overview | Refresh with `aria-busy` |
| 1024 | Pandit application | email autocapitalize off; trust link; refocus on “another application” |
| 1025 | Accessibility docs | hash focus, contact/for-pandits forms, post-deletion heading focus |
| 1026 | StoryContext | length live region; Save `aria-busy`; form-actions hint |
| 1027 | GuidanceFlow | notes counter `aria-live="polite"` |
| 1028 | DownloadPlatform | Android/iOS LinkKeyboardGroup hints |
| 1029 | global-error.tsx | sr-only Arrow/Home/End/Escape hint |
| 1030 | Account delete | group hints; Delete/Yes `aria-busy`; alert live + Escape → confirm field |
| 1031 | Account preferences | free tools + draft in keyboard recovery row |
| 1032 | SiteHeader focus trap | Applied the fix described in the UX improvement loop. |
| 1033 | Chat empty log | No longer steals focus from the composer. |
| 1034 | `src/app/(public)/our-approach/page.tsx` | Hindi eyebrow `Ek Soch…` lacks `lang="hi"` (screen readers mispronounce). |
| 1035 | `src/app/(public)/about/InformationPage.tsx` | No page-level `<nav aria-label="Breadcrumb">` on long info pages (contact/a11y/about). |
| 1036 | `src/components/legal/LegalShell.tsx` | Horizontal tabs have no “scroll for more” hint on mobile (overflow clipped mentally); add fade/aria hint. |
| 1037 | `src/features/account/CustomerNav.tsx` | “Updates” has no badge/`aria-label` for unread; e.g. `Updates (3)` + `aria-label="Updates, 3 unread"`. |
| 1038 | `src/features/account/ProfileForm.tsx` | Save errors are status-only, not field-linked (`aria-describedby` on dob etc.). |
| 1039 | Accessibility | Documents help-search + 404 focus behavior |
| 1040 | Home FAQ accordion a11y | exclusive `name="home-faq"`, `aria-controls`, focus-visible, answer region wrapper |
| 1041 | Article related | always shown; empty fallback + “all in category” link; focus/line-clamp styles |
| 1042 | InformationPage | stable `h1` id + `aria-labelledby` on content |
| 1043 | Legal/privacy tables | mobile swipe hint, touch overflow, tighter mobile cell padding |
| 1044 | Cookie inventory table | `legal-table` class + swipe aria label |
| 1045 | GoBackButton | clearer `aria-label` + same-origin/`history.length` guard |
| 1046 | Guidance Pandit step | directory load error focuses for recovery |
| 1047 | Expert directory | full load failure focuses the alert |
| 1048 | Notification preferences | load-failure alert focuses |
| 1049 | Home overview | focused summary alert; dropped nested per-line `role="alert"` |
| 1050 | Notifications | invalid payload alert focuses |
| 1051 | Accessibility docs | notes account/directory/guidance error focus |
| 1052 | Guidance “Start fresh” | replaced `window.confirm` with Escape + focus-trap alertdialog |
| 1053 | Pandit search Escape | clears the name field (help search empty state also improved) |
| 1054 | Mobile menu a11y | dialog labelled; Escape-to-close documented |
| 1055 | Accessibility page | documents Escape for menu, dialogs, and search clear |
| 1056 | Accessibility statement:** claims aligned to real skip link / motion / table swipe behavior; no WCAG audit claim | Applied the fix described in the UX improvement loop. |
| 1057 | Zodiac:** invalid `?sign=` hint, submit-time validation, wrap + 44px targets | Applied the fix described in the UX improvement loop. |
| 1058 | Account delete:** success lands on `/delete-account?deleted=1`; error focus; public instructions link | Applied the fix described in the UX improvement loop. |
| 1059 | Help search** no longer steals focus to the empty panel while typing (Enter still focuses empty recovery). | Applied the fix described in the UX improvement loop. |
| 1060 | Application form Escape** restores focus to invalid fields; **ArticleShare Escape** dismisses status even when the URL field is open. | Applied the fix described in the UX improvement loop. |
| 1061 | `d:\Projects\pandittalk-website\src\features\experts\ExpertDirectory.tsx` (`ExpertPortrait`) | Fallback initial is `aria-hidden`, so a broken image leaves no accessible portrait name. — Use `role="img"` + `aria-label={expert.name}` on the fallback. |
| 1062 | ExpertDirectory | Opening filters focuses search; Escape returns focus to toggle |
| 1063 | GuidanceFlow | Inert background during clear dialog; focus on deep-link note / cleared status |
| 1064 | DeleteAccount | Final Escape-capable confirm dialog before deactivation |
| 1065 | Accessibility | Documents filter focus return + legal TOC/tab scrolling |
| 1066 | LinkKeyboardGroup | supports `as="span"` for inline link rows |
| 1067 | Media leave/end confirms | Cancel/Stay vs Leave/End keyboard-grouped |
| 1068 | Chat/media control hints | sr-only Arrow / Escape hints wired to live controls |
| 1069 | `d:\Projects\pandittalk-website\src\app\globals.css` (`.home-faq-item summary`) | `+`/`–` via `::after` only; expand/collapse cue not in the accessibility tree. **Fix:** Put an explicit `aria-hidden` icon in markup or rely on native marker with visible text like “Show answer”. |
| 1070 | `d:\Projects\pandittalk-website\src\features\account\StoryContext.tsx` | Create/save silently returns on empty/`busy` with no inline validation message; textarea lacks `required`. **Fix:** Set `required`, surface “Add a short note before saving”, set `aria-invalid` when submit blocked. |
| 1071 | `d:\Projects\pandittalk-website\src\components\site\SiteHeader.tsx` | `next/image` logo has fixed width/height but no `sizes` (and `alt=""`). **Fix:** Add `sizes="39px"` (and meaningful alt or `aria-label` on the brand link). |
| 1072 | `d:\Projects\pandittalk-website\src\features\guidance\GuidanceFlow.tsx` | “Start fresh” clear control has no destructive `aria-label` and no status after clear (only `window.confirm`). **Fix:** `aria-label="Clear draft and start over"` + `role="status"` “Draft cleared”. |
| 1073 | Pandit application | Focus first invalid field on validation |
| 1074 | Errors / profile-setup | Focus error titles; skeleton loading fallback |
| 1075 | PanditApplicationForm | honest honeypot message + focus; phone `aria-invalid` uses normalize |
| 1076 | Directory empty | Escape clears active filters (or blurs) |
| 1077 | Account settings | Escape blurs focused card |
| 1078 | Customer home tiles | keyboard group + `minmax` CSS so zoom doesn’t overflow |
| 1079 | `d:\Projects\pandittalk-website\src\app\(journal)\articles\[slug]\page.tsx` | Uses `<article>` with no `id="main-content"`; skip link fails on article pages. |
| 1080 | `d:\Projects\pandittalk-website\tests\ui\responsive.spec.ts` | Still expects `#site-content` focus after skip; update assertion to `#main-content` (or dual-target). |
| 1081 | `d:\Projects\pandittalk-website\src\app\layout.tsx` | `appleWebApp.capable` is on but there is no Android/iOS splash/`apple-touch-startup-image` / web manifest under `public/`. |
| 1082 | Journal tables/code | Escape blurs focusable table regions and `<pre>` blocks |
| 1083 | LinkKeyboardGroup | Arrow/Home/End also moves between enabled buttons (not only links) |
| 1084 | Journal categories | Escape blurs when unfiltered; arrow focus scrolls chips into view |
| 1085 | Notification prefs | Status scrolls into view; Escape restores the failed checkbox; footer links are keyboard-grouped |
| 1086 | Free tool form | Escape clears coordinate/form errors; post-reading actions + Clear/Print are keyboard-grouped |
| 1087 | Global error + delete account | Escape leaves the error title; invalid delete fields focus/scroll into view |
| 1088 | Editorial: labelling / journal / correction rows | `aria-describedby` |
| 1089 | Saved report: Print/PDF + free-tool row | `LinkKeyboardGroup` |
| 1090 | For Pandits / a11y docs | apply focus fallback; documented new behaviors |
| 1091 | Guidance Continue | Live hint (`aria-describedby`) when area/format is missing. |
| 1092 | Tool clear reading | Opens the edit `<details>` before focusing the first field. |
| 1093 | Pandit application | Validation focuses the first invalid field. |
| 1094 | Mobile menu:** Outside dismiss returns focus to the menu control; summary announces Escape. | Applied the fix described in the UX improvement loop. |
| 1095 | Deep links:** `FocusOnHash` also re-focuses on `pageshow` (bfcache). | Applied the fix described in the UX improvement loop. |
| 1096 | Pandit directory:** Clear filters reopens the panel and focuses search. | Applied the fix described in the UX improvement loop. |
| 1097 | Guidance continue:** `aria-disabled` + focuses the “choose area/format” hint instead of a dead click. | Applied the fix described in the UX improvement loop. |
| 1098 | Notifications:** Toggling unread announces and focuses status. | Applied the fix described in the UX improvement loop. |
| 1099 | Story share details:** Escape closes and returns focus to the summary. | Applied the fix described in the UX improvement loop. |
| 1100 | Help search:** Enter on zero matches focuses the empty state. | Applied the fix described in the UX improvement loop. |
| 1101 | Back to top:** Escape blurs the control. | Applied the fix described in the UX improvement loop. |
| 1102 | CSS:** `button[aria-disabled="true"]` matches disabled styling. | Applied the fix described in the UX improvement loop. |
| 1103 | Jump to latest | Escape blur + clearer label |
| 1104 | Notifications main | `aria-busy` while loading or marking |
| 1105 | Notifications status Escape also clears Unread-only filter | Applied the fix described in the UX improvement loop. |
| 1106 | Media Check devices | keyboard group with tools/draft |
| 1107 | Article Share | dedicated Arrow/Escape keyboard hint |
| 1108 | Article related | Related article grid keyboard-grouped; empty-related journal/guidance links too |
| 1109 | Help articles | Pause links + email-support cluster keyboard-grouped (`source` still required) |
| 1110 | LegalDocumentPage | on-this-page TOC Escape blur |
| 1111 | HomeFaq + Pandit application | footer help hint; success steps hint + Submit `aria-busy` |
| 1112 | Full Reading tree is `aria-live="polite"` | Applied the fix described in the UX improvement loop. |
| 1113 | For-Pandits “Start an application” doesn’t focus the form on same-page click | Applied the fix described in the UX improvement loop. |
| 1114 | Notifications | Mark all / Refresh / Unread only in one keyboard group; per-card actions + preferences shortcut with hints |
| 1115 | Pandit profile | bio journal/trust/editorial keyboard row; missing-profile recovery adds free tools |
| 1116 | Paid tools + ToolForm birth help | conversation/birth next-step keyboard hints |
| 1117 | Chat reconnect help | draft in inline keyboard row |
| 1118 | Notifications “all caught up” | Escape dismissible |
| 1119 | Mobile menu a11y | focus moves into panel; Tab trap scoped; `role="dialog"` + `aria-modal` while open |
| 1120 | Cancel focus trap | Escape `preventDefault` so focus restores cleanly |
| 1121 | Guidance step strip | Arrow / Home / End / Escape |
| 1122 | Guidance Back / Continue / Start fresh | `LinkKeyboardGroup` |
| 1123 | Guidance clear-draft confirm | `LinkKeyboardGroup` |
| 1124 | Media Join + help, live controls, and confirms | `LinkKeyboardGroup` |
| 1125 | Contact subject shortcuts + recovery links | `LinkKeyboardGroup` |
| 1126 | Notification card actions + preferences shortcut | `LinkKeyboardGroup` |
| 1127 | Tool birth fields | Escape clears name, date, time, city (coordinates already did) |
| 1128 | Contact shortcuts | Escape blurs the focused mailto button |
| 1129 | Chat empty log | focuses once when connected with no messages |
| 1130 | Home overview | empty notice blurs with Escape; a11y docs updated |
| 1131 | `src/components/site/HomeFaq.tsx` (+ `src/app/page.tsx`) | Escape closes open FAQ answer and restores focus |
| 1132 | (public: customer | journal — legal)/loading.tsx` — `aria-live="polite"` on skeletons |
| 1133 | `src/app/(legal)/cookie-policy/page.tsx` + `LegalDocumentPage.tsx` | Table captions for screen readers |
| 1134 | Help articles | per-slug next steps keyboard-grouped |
| 1135 | Download help | account / Play / iOS / draft links keyboard-grouped |
| 1136 | Disclaimer + refund policy | next-step clusters keyboard-grouped |
| 1137 | `src/features/account/Account.tsx` (`Preferences`) | Per-control feedback: status beside the toggled row + `aria-describedby`, not one global “Preferences saved.” |
| 1138 | `src/components/site/SiteHeader.tsx` | Skip link targets `#site-content` while pages use `#main-content`; point skip at `main` / focus main on activate. |
| 1139 | `src/components/articles/ArticleCard.tsx` | Cover `alt=""` inside a link titled by `<h2>`; empty alt is OK only if the link name is sufficient—prefer meaningful alt or `aria-labelledby` on the card. |
| 1140 | `src/app/global-error.tsx` | Unstyled system UI, no Skip/brand tokens; at least reuse CSS variables + focusable primary actions. |
| 1141 | Home overview | load-error alert blurs with Escape |
| 1142 | Global error | heading re-focuses on bfcache `pageshow` |
| 1143 | Preferences load error | Escape blur + free-tools recovery |
| 1144 | Phone-change success | Escape leaves the verified notice |
| 1145 | Contact recovery links | Arrow / Home / End / Escape |
| 1146 | 404 destinations | Arrow / Home / End / Escape between popular links |
| 1147 | Palm reading | Escape clears a chosen photo (file field or Clear) |
| 1148 | Download `#ios` | re-focuses after bfcache `pageshow` |
| 1149 | Private story | empty list focuses the empty panel |
| 1150 | Guidance area | Escape clears the selected area |
| 1151 | Cookie inventory | focusable table region blurs on Escape |
| 1152 | Help empty search | Escape from the empty panel clears the query |
| 1153 | SiteHeader: Mobile menu leaves page scrollable and focus free | Lock body scroll and trap Tab inside the open panel |
| 1154 | Empty article body | Focuses once; Escape leave; recovery links unchanged |
| 1155 | Chat empty log | Focus once; Escape leave; Retry + reconnect help while connecting |
| 1156 | Legal “Skip to document” keyboard group adds free tools + draft | Applied the fix described in the UX improvement loop. |
| 1157 | Legal policy tabs | Escape returns to current policy (or blurs) |
| 1158 | Cookie footer follow-up uses EscapeBlurNotice | Applied the fix described in the UX improvement loop. |
| 1159 | Reading medical + disclaimer notices are Escape-blur focusable | Applied the fix described in the UX improvement loop. |
| 1160 | Route + global error “Try again” use `aria-busy` / disabled while retrying | Applied the fix described in the UX improvement loop. |
| 1161 | `d:\Projects\pandittalk-website\src\app\(public)\join-as-pandit\page.tsx` | `redirect('/for-pandits#apply')` drops the hash in Next.js, so applicants land at the top of For Pandits. **Fix:** Redirect to `/for-pandits` and scroll/focus `#apply` client-side, or use a query like `?apply=1`. |
| 1162 | `d:\Projects\pandittalk-website\src\components\site\SiteHeader.tsx` | Skip link targets `#site-content` (wrapper) instead of `#main-content`. **Fix:** Point skip link to `#main-content` so focus lands on the page heading landmark. |
| 1163 | `d:\Projects\pandittalk-website\src\app\global-error.tsx` | Bare system-ui error UI with unstyled tiny buttons (poor mobile touch / brand). **Fix:** Reuse button min-height styles and a short support mailto/link. |
| 1164 | `d:\Projects\pandittalk-website\src\features\guidance\GuidanceFlow.tsx` | Progress bar is `aria-hidden` while step buttons can be hard to use on small screens (6 dense controls). **Fix:** Keep status text; collapse step nav to “Step N of 6” + Back/Continue on mobile. |
| 1165 | `src/features/pandits/PanditApplicationForm.tsx` | Invalid phone sets error text but not `aria-invalid`. · Set `aria-invalid` when validation fails. |
| 1166 | `src/features/experts/ExpertDirectory.tsx` | Active filter count badge isn’t in the control’s accessible name. · `aria-label={`Filter & sort, ${n} active`}`. |
| 1167 | Notifications | Escape exits unread-only; focus empty unread filter with hint |
| 1168 | FocusMainHeading | won’t steal focus if the user already moved into controls; respects reduced motion |
| 1169 | Reports print | Escape dismisses the print-status note |
| 1170 | Notifications | empty inbox focuses on first load; status dismisses with Escape |
| 1171 | Phone change | non-error status dismisses with Escape |
| 1172 | Delete account | failure alert dismisses with Escape |
| 1173 | Media / chat | confirmation Escape uses `preventDefault` |
| 1174 | Article share | Escape returns focus to Copy link; Hide link returns there too |
| 1175 | FocusMainHeading | re-focuses after bfcache `pageshow` |
| 1176 | Private story | save status dismisses with Escape |
| 1177 | `src/features/account/Account.tsx` (`DeleteAccount`) | DELETE confirm input has no `name`, `aria-describedby`, or custom invalid message. Fix: labeled field + clear `title`/`aria-invalid` feedback. |
| 1178 | `src/features/tools/ToolForm.tsx` (`BirthFields`) | Coordinates errors only after submit; no `aria-invalid` / inline field errors. Fix: field-level validation messaging. |
| 1179 | `src/app/globals.css` (`.footer-links a`) | Desktop `min-height: 40px` (below 44). Fix: use 44px at all breakpoints. |
| 1180 | `src/components/site/SiteHeader.tsx` | Mobile `<summary>` lacks `aria-expanded`. Fix: sync open state to `aria-expanded`. |
| 1181 | `src/app/globals.css` | `input:focus` border + global `focus-visible` outline = double ring. Fix: style `:focus-visible` only for fields. |
| 1182 | `src/app/globals.css` (`input::file-selector-button`) | ~7px padding; weak palm/profile photo touch target. Fix: min 44px height on file button. |
| 1183 | `src/app/(public)/for-pandits/page.tsx` | Not on `InformationPage`; no success focus move after submit. Fix: focus status message + optional dashboard FAQ. |
| 1184 | `src/features/account/CustomerNav.tsx` | Horizontal scroll-only nav; scroll hint exists only in `aria-label`. **Fix:** Visible cue (“Swipe for more”) or wrap/scroll shadows for sighted mobile users. |
| 1185 | `src/features/guidance/GuidanceFlow.tsx` + `globals.css` | Mobile step labels `text-overflow: ellipsis` hide “Conversation scope” etc.; progress bar is `aria-hidden`. **Fix:** Abbreviate labels intentionally or use icon+tooltip; keep text status (already present) and don’t truncate below readable names. |
| 1186 | `src/components/site/SiteFooter.tsx` | `/for-pandits#apply` only hashes; `ForPanditsClient` only auto-scrolls/focuses on `?apply=1`. **Fix:** Also handle hash `#apply` on mount (or change footer to `?apply=1`). |
| 1187 | `src/components/site/SiteHeader.tsx` | Skip link targets `#site-content` while pages/`accessibility` claim “main content” (`#main-content`). **Fix:** Point skip link to `#main-content` (ensure one landmark) or rename consistently. |
| 1188 | `src/components/site/SiteHeader.tsx` | Logo `alt=""`; brand text exists, but accessibility page claims skip-to-main accuracy matters more—still, decorative logo OK. Separate: mobile menu closes on any `focusin` outside, including moving focus into page content awkwardly. **Fix:** Only close on outside pointer / Escape, not every focusin. |
| 1189 | `src/app/(public)/accessibility/page.tsx` | Claims “Skip link to main content” but header skip goes to `#site-content`. **Fix:** Align implementation and copy (see #23). |
| 1190 | Delete account | keyboard recovery on prep + post-delete actions; waitlists (`website_delete_account`, `website_delete_account_done`) |
| 1191 | Account privacy | keyboard groups on all action rows; waitlist (`website_account_privacy`) |
| 1192 | Privacy / terms footers | related-link keyboard nav + waitlists (`website_privacy_policy` / `website_terms`; `source` still required) |
| 1193 | Notifications | Escape on load/invalid alerts; Arrow between action links; free-tools recovery |
| 1194 | Chat / media errors | Escape dismisses; free-tools + draft recovery; post-chat Arrow keys |
| 1195 | Closed mobile nav clipped + `aria-hidden`/`inert` so it can’t measure as overflow | Applied the fix described in the UX improvement loop. |
| 1196 | Account sign-out Escape returns focus to Sign out | Applied the fix described in the UX improvement loop. |
| 1197 | Customer nav Escape blurs when already on the current section | Applied the fix described in the UX improvement loop. |
| 1198 | Home FAQ Escape from an answer link closes and returns to its question | Applied the fix described in the UX improvement loop. |
| 1199 | Cookie footer + editorial journal/correction rows keyboard-grouped | Applied the fix described in the UX improvement loop. |
| 1200 | Download iOS follow-ups + disclaimer trust links keyboard-grouped | Applied the fix described in the UX improvement loop. |
| 1201 | Customer-nav pause links | `LinkKeyboardGroup` + skip hint |
| 1202 | Global-error recovery | `aria-describedby` Arrow/Home/End/Escape hint |
| 1203 | Reading palm/general disclaimer links keyboard-grouped | Applied the fix described in the UX improvement loop. |
| 1204 | Large-text wrap for pause notes / soft-404 / reading; a11y log updated | Applied the fix described in the UX improvement loop. |
| 1205 | ArticleShare / ArticleCard | Always-available Copy link; card `aria-label` with title + meta |
| 1206 | Empty journal uses Escape-blur shell with live status | Applied the fix described in the UX improvement loop. |
| 1207 | FocusOnHash:** retries until target mounts | Applied the fix described in the UX improvement loop. |
| 1208 | Directory filters | Escape clears search first, then closes panel |
| 1209 | Tool errors marked `data-form-error` + `aria-atomic` | Applied the fix described in the UX improvement loop. |
| 1210 | Help search empty | recovery actions keyboard-grouped (incl. Show all topics) |
| 1211 | How it works | prepare, pricing, join, formats, story, and after-conversation rows keyboard-grouped |
| 1212 | Our approach / Editorial | boundary and next-step / labelling links keyboard-grouped |
| 1213 | SiteHeader account | Arrow / Home / End / Escape; skip stays `#site-content` |
| 1214 | Delete account | before / form / error / confirm action clusters keyboard-grouped |
| 1215 | Guidance steps | buttons expose `N. Label` via `aria-label` (matches journeys tests; no duplicate numbers) |
| 1216 | Palm validation | `#tool-form-error` + focus on invalid/oversize/read failures; journey test updated for HEIC (PNG is valid) |
| 1217 | SiteHeader brand | `aria-label="Pandit Talk home"` (skip still `#site-content`) |
| 1218 | Footer Back to top | scrolls and focuses `#site-content` (respects reduced motion) |
| 1219 | Pandit application | Privacy/Terms keyboard group; success/error recovery add how-it-works |
| 1220 | Article share | after Share/Copy status, follow-up keyboard row (journal/tools/draft) |
| 1221 | Expert detail | Focus unavailable heading on error/404 |
| 1222 | Contact / a11y / for-pandits / Go back / loadings / global-error | Account-access shortcut, mailto sr-only, apply focus outline, simpler history back, cleaned skeletons, mailto hint on fatal error |
| 1223 | `d:\Projects\pandittalk-website\src\app\globals.css` | `.home-faq-item summary` has no local focus treatment; add `border-radius` + padding so global `outline-offset:4px` isn’t clipped by FAQ borders. |
| 1224 | `d:\Projects\pandittalk-website\src\components\site\SiteHeader.tsx` | brand `aria-label="Pandit Talk home"` duplicates visible “Pandit Talk”; drop label or use “Home” only. |
| 1225 | `d:\Projects\pandittalk-website\src\features\account\CustomerNav.tsx` + `customer.module.css` | horizontal scroll with no swipe hint; add `aria-label` note or fade/edge cue (“swipe for more”). |
| 1226 | `d:\Projects\pandittalk-website\src\features\account\StoryContext.tsx` | `<details><summary>Share with your Pandit</summary>` lacks FAQ-style focus affordance; ensure summary gets visible focus ring (same as home FAQ). |
| 1227 | `d:\Projects\pandittalk-website\src\components\site\SiteHeader.tsx` | mobile `summary` stays “Menu” when open; toggle visible label / `aria-expanded` text to “Close menu” for clearer a11y. |
| 1228 | Chat ended + controls | `aria-describedby` hints moved before keyboard groups |
| 1229 | Media controls | hint before group; camera toggle gets `aria-busy` + busy label |
| 1230 | Account sign-out | Failed logout focuses the alert; `aria-busy` on the button. |
| 1231 | Notification prefs | Focus save/error status after each toggle. |
| 1232 | Notifications | Focus status after mark-read; articles labelled for assistive tech. |
| 1233 | Profile / story | Focus status after save/upload/validation failures. |
| 1234 | Delete-account / cookies / journal chips / a11y docs | recovery links; chip keyboard; documented behaviors |
| 1235 | Phone change | alert-only focus on invalid phone (no status/field race); status id wired into fields |
| 1236 | Profile form | birth field `aria-invalid` + scroll-into-view on status |
| 1237 | Directory empty + download `#ios` | focus empty when filters yield zero; hash focus independent of iOS detection |
| 1238 | Empty private-story next steps | keyboard hint via `aria-describedby` |
| 1239 | Guidance draft-storage recovery | keyboard hint |
| 1240 | Home overview | focuses load-failure alert |
| 1241 | Phone change | autofocus, SMS help, `enterKeyHint`, refocus on different number |
| 1242 | Article share / ToolForm | `aria-busy`; submit typed for free readings |
| 1243 | global-error / a11y docs | Free tools escape; documented focus/inert behaviors |
| 1244 | Pandit application | failed-submit recovery keyboard group |
| 1245 | Profile load | Escape blurs the alert; recovery + phone/privacy links use Arrow / Home / End |
| 1246 | Horoscope zodiac hint | Escape dismisses and focuses the first sign chip |
| 1247 | Home / How it works / Tools waitlist anchors | Escape blur when deep-linked |
| 1248 | Private story | pause/confirm/load/empty/edit hints; Confirm delete/share `aria-busy` |
| 1249 | Disclaimer + refund | next-steps keyboard hints |
| 1250 | Preferences load | recovery keyboard hint |
| 1251 | Horoscope signs:** Arrow / Home / End move between options; Escape clears the selection and URL | Applied the fix described in the UX improvement loop. |
| 1252 | Tarot backs:** Escape clears the card-back choice | Applied the fix described in the UX improvement loop. |
| 1253 | Birth coordinates:** Escape clears the field and any coord error | Applied the fix described in the UX improvement loop. |
| 1254 | Profile:** Invalid DOB/time focuses the field (reduced-motion scroll); load error adds tools + contact recovery; Escape clears birth time | Applied the fix described in the UX improvement loop. |
| 1255 | Delete account:** Escape clears the DELETE confirmation field | Applied the fix described in the UX improvement loop. |
| 1256 | Pandit application:** Escape clears phone; status focus respects reduced motion | Applied the fix described in the UX improvement loop. |
| 1257 | Phone change:** Escape clears the number field | Applied the fix described in the UX improvement loop. |
| 1258 | Article share:** Escape dismisses status when the URL field is hidden | Applied the fix described in the UX improvement loop. |
| 1259 | Guidance:** Empty Pandit list is a focusable `role="status"` with Escape leave. | Applied the fix described in the UX improvement loop. |
| 1260 | 404:** Primary recovery actions wrapped in `LinkKeyboardGroup`. | Applied the fix described in the UX improvement loop. |
| 1261 | global-error:** Recovery cluster labeled with arrow/Home/End/Escape navigation. | Applied the fix described in the UX improvement loop. |
| 1262 | For Pandits:** Dashboard and apply cards get keyboard action groups. | Applied the fix described in the UX improvement loop. |
| 1263 | Account prefs:** Load-error recovery uses `LinkKeyboardGroup`. | Applied the fix described in the UX improvement loop. |
| 1264 | SiteHeader Updates+aria-expanded | Implemented during the UX 500+ goal loop. |
| 1265 | footer 44px touch | Implemented during the UX 500+ goal loop. |
| 1266 | file button 44px | Implemented during the UX 500+ goal loop. |
| 1267 | contrast muted | Implemented during the UX 500+ goal loop. |
| 1268 | SiteHeader mobile Tab trap | Implemented during the UX 500+ goal loop. |
| 1269 | CustomerNav aria-describedby | Implemented during the UX 500+ goal loop. |
| 1270 | SiteHeader Tab trap | Implemented during the UX 500+ goal loop. |
| 1271 | Reading name + no full aria-live | Implemented during the UX 500+ goal loop. |
| 1272 | ForPandits focus apply | Implemented during the UX 500+ goal loop. |
| 1273 | contact/help/a11y mailto sr-only | Implemented during the UX 500+ goal loop. |
| 1274 | Preferences save controls | Expose aria-busy/per-row busy on preference saves |
| 1275 | PhoneChange resend | Expose aria-busy during resend cooldown path |
| 1276 | Profile photo upload | Expose aria-busy during avatar upload |
| 1277 | PanditApplication phone +91 | +91 + focus status messaging |
| 1278 | DeleteAccount a11y | Accessible delete confirmation flow |
| 1279 | Pandit name link touch targets | Min 44px touch height |
| 1280 | File upload button touch targets | 44px touch height |
| 1281 | FAQ summary focus rings | Visible focus on accordion summary |
| 1282 | Muted contrast too low | Improve muted text contrast |
| 1283 | Skip link target wrong | Skip link to focusable #site-content |
| 1284 | accessibility skip copy | Accurate skip-link copy on a11y page |
| 1285 | Android download free-tools action | Free-tools action in keyboard group on download |
| 1286 | Story focus after delete/share | Focus status after story mutations |
| 1287 | Notifications focus management | Focus management on notification actions |

## Empty / recovery states (151)

| # | Issue | Fix |
|---|---|---|
| 1288 | global-error | Go back control. |
| 1289 | No `error.tsx` / `global-error.tsx` | zero files under `src/app`. **Fix:** Add route-level `error.tsx` (and root `global-error.tsx`) with retry + home/help links. |
| 1290 | Story share select uses local date | `toLocaleDateString()` without IST. **Fix:** IST short date in options. |
| 1291 | `(legal\|customer\|public)/loading.tsx` | Richer skeleton loading (legal loading added) |
| 1292 | `expert/[id]` / `experts/[id]` | Empty id soft-redirects to `/pandits` |
| 1293 | Notification prefs load failure | notifications + contact recovery. |
| 1294 | `src/features/pandits/PanditApplicationForm.tsx` | Whitespace-only name/practice pass HTML `required`, then `trim()` can submit empty strings. — Reject empty trimmed name/practice client-side before POST. |
| 1295 | Article share recovery:** Clipboard-blocked path now gets tools / draft / contact follow-ups (not only success). | Applied the fix described in the UX improvement loop. |
| 1296 | HomeOverview | announced load failures + retry |
| 1297 | Prefs + private-story loading | tools/draft while waiting |
| 1298 | Story delete/share confirms | tools/draft recovery |
| 1299 | CustomerNav / FooterNav / journal categories / Home FAQ / contact recovery | hints keep skip on `#site-content` |
| 1300 | `src/features/account/ProfileForm.tsx` (~L100) | Applied the fix described in the UX improvement loop. |
| 1301 | `src/features/account/HomeOverview.tsx` (~L35–37) | Applied the fix described in the UX improvement loop. |
| 1302 | `src/features/account/Account.tsx` (`Preferences`, ~L56) | Applied the fix described in the UX improvement loop. |
| 1303 | `src/features/account/Account.tsx` (`PhoneChange`, ~L61–80) | Applied the fix described in the UX improvement loop. |
| 1304 | `src/features/account/ProfileForm.tsx` (~L37–38, ~L97) | Applied the fix described in the UX improvement loop. |
| 1305 | `src/app/error.tsx` | Applied the fix described in the UX improvement loop. |
| 1306 | `src/features/guidance/GuidanceFlow.tsx` (~L103–112) + Expert empty directory | Applied the fix described in the UX improvement loop. |
| 1307 | Profile-setup load failure | Adds **Skip for now** (`skipHref`) when `/users/profile` fails. |
| 1308 | Media join/connect errors | **Try joining again** / **Retry connection** on the error panel. |
| 1309 | `src/app/not-found.tsx` | No `metadata`/`title` (“Page not found”); browsers/share cards inherit the site default. |
| 1310 | `src/features/notifications/Notifications.tsx` | Main lacks `id="main-content"` (skip target inconsistency with public pages). |
| 1311 | No `loading.tsx` / `error.tsx` anywhere under `src/app` | route transitions show blank; add segment-level loading UI for journal, pandits, customer. |
| 1312 | `src/components/articles/MarkdownBody.tsx` | Images allow empty `alt=""` with no figure/credit; require meaningful alt or mark decorative explicitly. |
| 1313 | `src/components/articles/ArticleCard.tsx` | Cover `alt` often duplicates title (noisy for SR); use empty alt when title is adjacent text. |
| 1314 | GoBackButton | Same-origin referrer gate (no false `history.length` back) |
| 1315 | Home reduced-motion | FAQ marker, skeleton, editorial/story transitions respect `prefers-reduced-motion` |
| 1316 | Articles SEO soft-404 | invalid `?category=` now `notFound()` instead of a 200 empty page |
| 1317 | Markdown:** blocked `//` protocol-relative links; allow `tel:`; empty body/img guards; `hr` + `th scope="col"` | Applied the fix described in the UX improvement loop. |
| 1318 | Directory presence / empty copy** state app-online ≠ bookable here; filtered empty uses prepare-with language. | Applied the fix described in the UX improvement loop. |
| 1319 | `d:\Projects\pandittalk-website\src\features\account\StoryContext.tsx` | Story titles hard-cut at 48 chars mid-word. — Truncate on a word boundary (or `…` after last space). |
| 1320 | `d:\Projects\pandittalk-website\src\features\reports\Reports.tsx` | Missing report id shows generic error + “Try again” with no recovery path. — On 404, show “Report not found” + link to `/reports`. |
| 1321 | `d:\Projects\pandittalk-website\src\features\tools\ToolForm.tsx` | Horoscope `<select>` defaults to Aries with no “Choose your sign” empty option. — Add disabled empty option and require an explicit choice. |
| 1322 | Related articles | Falls back to journal-wide pieces when category is empty |
| 1323 | Customer home | Empty-state notice + clearer tile copy + draft tile |
| 1324 | Notifications | “Unread only” / “Show all” filter |
| 1325 | `d:\Projects\pandittalk-website\src\features\account\StoryContext.tsx` | No min-length / near-limit warning beyond a counter; users can save tiny stubs that look broken when shared. **Fix:** Enforce a small min length (e.g. 10) and warn at ≥90% of 2000. |
| 1326 | Notifications | empty = “No notifications yet”; “all caught up” only when list exists & unread=0 |
| 1327 | `d:\Projects\pandittalk-website\src\features\account\Account.tsx` (`Preferences`) | same: add `id="main-content"`. |
| 1328 | `d:\Projects\pandittalk-website\src\features\account\Account.tsx` (`PhoneChange`) | Implemented: `d:\Projects\pandittalk-website\src\features\account\Account.tsx` (`PhoneChange`) |
| 1329 | `d:\Projects\pandittalk-website\src\features\account\Account.tsx` (`DeleteAccount`) | Implemented: `d:\Projects\pandittalk-website\src\features\account\Account.tsx` (`DeleteAccount`) |
| 1330 | `d:\Projects\pandittalk-website\src\app\global-error.tsx` | Bare `<main>` without `id="main-content"`. |
| 1331 | `d:\Projects\pandittalk-website\src\app\(customer)\account\phone\page.tsx` | Implemented: `d:\Projects\pandittalk-website\src\app\(customer)\account\phone\page.tsx` |
| 1332 | `d:\Projects\pandittalk-website\src\app\(customer)\account\story\page.tsx` | Implemented: `d:\Projects\pandittalk-website\src\app\(customer)\account\story\page.tsx` |
| 1333 | `d:\Projects\pandittalk-website\src\app\(customer)\account\notifications\page.tsx` | Implemented: `d:\Projects\pandittalk-website\src\app\(customer)\account\notifications\page.tsx` |
| 1334 | `d:\Projects\pandittalk-website\src\app\(customer)\account\delete\page.tsx` | Implemented: `d:\Projects\pandittalk-website\src\app\(customer)\account\delete\page.tsx` |
| 1335 | `d:\Projects\pandittalk-website\src\app\(public)\pandits\[id]\page.tsx` | OG has no `images` (profile portrait or brand fallback). |
| 1336 | Empty journal recovery | Implemented: Empty journal recovery |
| 1337 | 404 destinations group | labelled + described |
| 1338 | Account sign-out | Error alert sits above the Sign out control. |
| 1339 | Empty directory | removed “check back soon”; honest empty + no charge |
| 1340 | Go back / global error:** Labels match history (`Previous page` vs `Go home`). | Applied the fix described in the UX improvement loop. |
| 1341 | Soft-404 Pandit profiles stay HTTP 200 + indexable | Applied the fix described in the UX improvement loop. |
| 1342 | Search debounce replaces live results with skeletons | Applied the fix described in the UX improvement loop. |
| 1343 | Opening a notification never marks it read | Applied the fix described in the UX improvement loop. |
| 1344 | Profile / account / grievance / download / pricing-policy | pause and help rows get hints and extra recovery links |
| 1345 | Preference load + phone-updated | draft in recovery rows |
| 1346 | Guidance Pandit-load | “Stay on draft” recovery |
| 1347 | Help empty-search | draft + skip-hint copy |
| 1348 | Profile + profile-setup Suspense fallbacks | tools/draft recovery while loading |
| 1349 | Journal categories | per-category titles/canonicals; invalid `?category=` is a soft-404 empty state with `noindex` |
| 1350 | `src/app/not-found.tsx` | Broken-link support mailto path |
| 1351 | `src/features/account/Account.tsx` (`Preferences`) | Don’t `disabled={busy}` the whole fieldset; disable only the active checkbox so other prefs stay usable. |
| 1352 | `src/app/not-found.tsx` | Add a client “Go back” (`history.length > 1 ? history.back() : '/'`) next to Home. |
| 1353 | `src/features/experts/ExpertDirectory.tsx` | Filters default closed on mobile (`filtersOpen=false`); open by default when `activeFilterCount > 0` or after search so results aren’t “empty” behind a toggle. |
| 1354 | `src/features/account/ProfileForm.tsx` | “Skip for now” → `/home` with no confirmation that profile is incomplete; soft banner on `/home` for unfinished setup. |
| 1355 | Global error | history label refreshes on `pageshow` |
| 1356 | Account settings | Arrow / Home / End between cards |
| 1357 | Directory filter toolbar adds tools/draft; load recovery notes skip `#site-content` | Applied the fix described in the UX improvement loop. |
| 1358 | 404 primary recovery hint notes skip remains `#site-content` | Applied the fix described in the UX improvement loop. |
| 1359 | Large-text stacking for dialog/notification/filter/profile action rows | Applied the fix described in the UX improvement loop. |
| 1360 | StoryContext: Delete/share use browser `confirm()` | Replace with in-page confirms (matches chat) |
| 1361 | ProfileForm: Blank fields keep saved values so users can’t clear data | Add clear/remove controls (or an explicit “clear this field” path) |
| 1362 | Private-story form + per-card actions include tools/draft recovery | Applied the fix described in the UX improvement loop. |
| 1363 | `d:\Projects\pandittalk-website\src\components\site\GoBackButton.tsx` | `history.length > 1` often true on first visit, so “Go back” can leave the site. **Fix:** Prefer `document.referrer` same-origin check, else go `/`. |
| 1364 | join-as-pandit` (redirect) is fine, but also omits nothing critical; however expert fetch uses `API_BASE` while pandit metadata uses `BACKEND_URL: | API_BASE`, so sitemap can be empty while pages work. **Fix:** Use the same env fallback chain as `pandits/[id]/page.tsx`. |
| 1365 | Account settings grid hint moved before cards | Applied the fix described in the UX improvement loop. |
| 1366 | Chat leave confirm | Prepare a draft recovery |
| 1367 | `src/features/guidance/state.ts` | Draft defaults `area: 'career'` and `format: 'chat'` without an explicit choice. · Start empty and block Continue until selected. |
| 1368 | Help empty search | ↑ returns to the search field |
| 1369 | Home overview errors | free-tools recovery path |
| 1370 | `src/features/account/ProfileForm.tsx`** + **`profile-setup/page.tsx` | New users land on form with “← Your account” and “all fields optional” with no first-run framing. Fix: setup-specific headline + primary “Continue to home” path. |
| 1371 | `src/features/reports/Reports.tsx` | Empty state OK; loading has no skeleton. Fix: simple list skeleton (parity with ExpertDetail). |
| 1372 | `src/features/account/Account.tsx` (`Preferences`) | Instant-save checkboxes with no per-control pending/error (only global status). Fix: disable toggled control while saving or show inline failure. |
| 1373 | How-it-works story copy (#3) | Applied the fix described in the UX improvement loop. |
| 1374 | Phone field consistency (account + pandit apply) (#15, #37) | Applied the fix described in the UX improvement loop. |
| 1375 | `src/features/account/ProfileForm.tsx` | Empty fields omitted from PATCH (“Leaving empty keeps saved value”) so users cannot clear DOB/address/etc. **Fix:** Explicit clear control or send null/empty for cleared fields with API support. |
| 1376 | `src/features/notifications/Notifications.tsx` | Shared `busy` disables every “Mark as read” while one request runs. **Fix:** Per-id busy (or optimistic local update). |
| 1377 | `src/app/error.tsx` | Claims draft notes/account data “are not lost by this error alone” without knowing cause. **Fix:** Neutral “Try again; if you were editing, check the page after reload.” |
| 1378 | `src/app/(public)/loading.tsx` | Generic “Loading…” with no page context (vs journal/customer). **Fix:** Route-group-specific status text where possible. |
| 1379 | Home overview / Account | recovery and shortcut Arrow / Home / End groups |
| 1380 | Private-story pause hint notes skip `#site-content` | Applied the fix described in the UX improvement loop. |
| 1381 | Notifications toolbar and loading state expose free tools + draft recovery | Applied the fix described in the UX improvement loop. |
| 1382 | Profile Suspense fallback adds skeleton; reading next steps include disclaimer | Applied the fix described in the UX improvement loop. |
| 1383 | Extra pandits | invented `experience: 10` → `0`; prod refuses non-empty `DEMO_ONLINE_PHONES` |
| 1384 | Notifications | no fake “0 unread” while loading; page `noindex` |
| 1385 | Notifications | Skeleton loading rows |
| 1386 | global-error | Go back only on same-origin referrer |
| 1387 | `d:\Projects\pandittalk-website\src\features\account\customer.module.css` | `scrollbar-width:thin` hides affordance on some OS; pair with mask/gradient when `scrollWidth > clientWidth`. |
| 1388 | `d:\Projects\pandittalk-website\src\app\globals.css` | unused `.empty-state` class; delete or adopt in customer empty panels for consistency. |
| 1389 | Pandit application errors | tools + draft recovery; skip hint notes `site-content` |
| 1390 | Empty journal | **Prepare a draft** added to next-step cluster |
| 1391 | Home glance / empty status | hints before groups; empty status includes draft |
| 1392 | Public / customer / journal / legal loading shells | tools/draft recovery while waiting |
| 1393 | Pandit directory | Search field described by live results status (incl. loading/error). |
| 1394 | Delete account | recovery links after failure (contact / access help / public deletion) |
| 1395 | Empty article body | hint wired (was claimed earlier, now present) |
| 1396 | Article Share follow-up + clipboard-blocked recovery | Implemented: Article Share follow-up + clipboard-blocked recovery |
| 1397 | Unknown guidance topic | contextual SoftResourceNotFound instead of global 404 |
| 1398 | Profile save failure | contact / help / tools / draft recovery |
| 1399 | Preference save failure | refresh + contact / tools / draft recovery |
| 1400 | Sign-out failure | contact / help / tools / draft recovery |
| 1401 | Tool-form errors | tools help in the recovery row |
| 1402 | Home overview | restored missing empty hint id; error recovery hint |
| 1403 | Help empty search:** Mailto with the failed query prefilled | Applied the fix described in the UX improvement loop. |
| 1404 | Notifications:** Arrow keys include **Mark as read** buttons, not only links. | Applied the fix described in the UX improvement loop. |
| 1405 | Fix how-it-works story copy mismatch | Completed in the autonomous UX loop. |
| 1406 | how-it-works story copy | Implemented during the UX 500+ goal loop. |
| 1407 | PhoneChange +91 | Implemented during the UX 500+ goal loop. |
| 1408 | profile-setup framing | Implemented during the UX 500+ goal loop. |
| 1409 | GoBackButton same-origin | Implemented during the UX 500+ goal loop. |
| 1410 | global-error UI | Implemented during the UX 500+ goal loop. |
| 1411 | not-found server+GoBackButton | Implemented during the UX 500+ goal loop. |
| 1412 | GoBack same-origin | Implemented during the UX 500+ goal loop. |
| 1413 | error.tsx contact | Implemented during the UX 500+ goal loop. |
| 1414 | PhoneChange cooldown/resend | Implemented during the UX 500+ goal loop. |
| 1415 | PhoneChange cooldown | Implemented during the UX 500+ goal loop. |
| 1416 | pandits soft-404 notFound | Implemented during the UX 500+ goal loop. |
| 1417 | notifications mark-on-open | Implemented during the UX 500+ goal loop. |
| 1418 | PhoneChange +91 cooldown | +91 label, cooldown, resend UX |
| 1419 | Reports timestamps IST | Format dates in IST with invalid-date guards |
| 1420 | Story context timestamps IST | IST labels on story events |
| 1421 | Notification times IST | IST display for notification list |
| 1422 | not-found page recovery | Server not-found + GoBackButton |
| 1423 | Home Updates tile missing | Add Updates tile on customer home |
| 1424 | Reports skeletons missing | Add loading skeletons for reports |
| 1425 | loading.tsx missing | Add route-level loading UI |
| 1426 | StoryContext titles/IST | Fix story titles and IST |
| 1427 | error.tsx boundaries | App error boundary with contact path |
| 1428 | Account preferences per-control feedback | Per-row busy/feedback on preferences |
| 1429 | 404 go-back button | Same-origin go-back on 404 |
| 1430 | Preferences busy/labels | Busy state + labels on preferences |
| 1431 | notifications per-id busy + legacy labels | Per-id busy and modern labels |
| 1432 | error.tsx copy | Clearer error.tsx user copy |
| 1433 | Reports labels | Clearer report labels |
| 1434 | Story create validation | Validate story create fields |
| 1435 | Preferences optimistic | Optimistic preference updates |
| 1436 | public loading copy | Clearer public loading copy |
| 1437 | Account privacy recovery links | Privacy page recovery/tools links |
| 1438 | Soft-404 recovery notify rows aria | aria improvements on soft-404 recovery/notify rows |

## SEO / soft-404 (91)

| # | Issue | Fix |
|---|---|---|
| 1439 | Help articles are thin templates | `help/[slug]/page.tsx`: 4 generic steps, no related links, no last-updated, no OG. **Fix:** Add related-help links, when-to-use notes, and per-article `openGraph`. |
| 1440 | Most public pages omit `openGraph` | e.g. `/tools`, `/help`, `/guidance`, `/pandits` only set `title`. **Fix:** Add `openGraph`/`description`/`url` on key marketing pages. |
| 1441 | Android/iOS theme meta incomplete | `layout.tsx` `viewport.themeColor: #f8f5ee` only; no `appleWebApp` / media-query theme. **Fix:** Extend `viewport` + `metadata.appleWebApp` (`capable`, `title`, `statusBarStyle`). |
| 1442 | Account privacy thin + hard-coded email | `account\privacy\page.tsx` uses `privacy@pandittalk.com` inline; no page `metadata`; no cookie/prefs links. **Fix:** Centralize email in `siteIdentity`, add `metadata`, link `/cookie-policy` + `/account/notifications`. |
| 1443 | Home has no page-level metadata | `src\app\page.tsx` inherits root only. **Fix:** Export home-specific `title`/`description`/`openGraph.url`. |
| 1444 | Help index / articles lack descriptions in metadata | titles only. **Fix:** Use article `summary` as `description`. |
| 1445 | Account subpages lack metadata | privacy/story/phone/delete/notifications pages. **Fix:** Add per-route `title`/`description`. |
| 1446 | `how-it-works/page.tsx` | Typed metadata + Open Graph; pricing-policy link on commitment step |
| 1447 | `sitemap.ts` | Adds detailed/monthly paid-tool URLs at lower priority |
| 1448 | `tools/*/detailed` + `monthly-horoscope` | Indexable pause pages with canonicals (aligned with sitemap) |
| 1449 | `src/app/page.tsx` | FAQPage JSON-LD answers omit the in-page help/pricing links shown in the visible FAQ. — Mirror the same destination links (or equivalent URLs) in the schema answers. |
| 1450 | `src/app/(public)/trust/page.tsx` | Trust metadata has no `alternates.canonical`. — Add `canonical: '/trust'`. |
| 1451 | `src/app/(public)/accessibility/page.tsx` | Accessibility metadata has no canonical. — Add `canonical: '/accessibility'`. |
| 1452 | `src/app/(public)/editorial-policy/page.tsx` | No canonical for `/editorial-policy`. — Add `canonical: '/editorial-policy'`. |
| 1453 | `src/app/(public)/help/page.tsx` | Help index is in the sitemap but has no canonical. — Add `canonical: '/help'`. |
| 1454 | `src/app/(public)/help/[slug]/page.tsx` | Unknown slugs still get `alternates.canonical` `/help/{slug}` before `notFound()`. — Return `robots: { index: false }` and omit canonical when the article is missing. |
| 1455 | `src/app/(public)/help/[slug]/page.tsx` | Help articles are Q&A content but expose no FAQPage structured data (unlike the home FAQ). — Add FAQPage JSON-LD for each help article. |
| 1456 | `src/app/(public)/for-pandits/page.tsx` | For-Pandits metadata has no canonical. — Add `canonical: '/for-pandits'`. |
| 1457 | `src/app/sitemap.ts` | Sitemap still lists `/tools/kundli/detailed`, `/tools/compatibility/detailed`, and `/tools/monthly-horoscope`, which are `noindex`. — Drop those paths from `publicPaths`. |
| 1458 | `src/app/(journal)/articles/[slug]/page.tsx` | Missing-article metadata is only `{ title: 'Article not found' }` with no `robots: noindex`. — Add `robots: { index: false }` when `!article`. |
| 1459 | `src/app/(journal)/articles/page.tsx` | Category filtered views (`?category=`) always canonicalize to `/articles`, conflating filtered SERP signals. — Self-canonical per category or `noindex` filtered views. |
| 1460 | `src/app/(public)/accessibility/page.tsx` | Title-only metadata; add a description (assistive-tech users often land via search). |
| 1461 | `src/app/(legal)/cookie-policy/page.tsx` | No “last updated”, canonical, or description metadata (unlike privacy/terms). |
| 1462 | `src/app/(legal)/disclaimer/page.tsx` | Same: title-only SEO; add description + canonical. |
| 1463 | `src/app/(legal)/pricing-policy/page.tsx` / `refund-and-cancellation-policy/page.tsx` / `grievance-redressal/page.tsx` | Title-only metadata; add descriptions for search/share. |
| 1464 | `src/app/sitemap.ts` | `/join-as-pandit` redirects but isn’t listed; either omit redirects or include canonical `/for-pandits` only (already there)—document; add missing public info pages if any diverge. |
| 1465 | `src/app/(journal)/articles/[slug]/page.tsx` | JSON-LD publisher name `PanditTalk` (no space) vs brand “Pandit Talk”. |
| 1466 | `src/app/(customer)/profile-setup/page.tsx` + `ProfileForm.tsx` | Setup metadata says “Complete your profile” but UI is account-edit framing (“← Your account”, “Back to home”); add first-run copy + “Skip for now → /home”. |
| 1467 | Grievance:** support email is `mailto`, related privacy/terms links, typed metadata, clearer acknowledgment wording | Applied the fix described in the UX improvement loop. |
| 1468 | Sitemap:** removed `/articles?category=…` query URLs; legal paths share priority `0.3` | Applied the fix described in the UX improvement loop. |
| 1469 | Robots:** disallow list clarified to match public `/for-pandits` vs blocked `/join-as-pandit` and legacy `/expert(s)` | Applied the fix described in the UX improvement loop. |
| 1470 | `d:\Projects\pandittalk-website\src\app\(public)\tools\page.tsx` (+ tool pages) | Hub and free/paused tool routes lack `alternates.canonical`. — Add canonicals (`/tools`, `/tools/kundli`, …). |
| 1471 | `d:\Projects\pandittalk-website\src\app\(public)\pandits\page.tsx` | Directory has no canonical. — `alternates: { canonical: '/pandits' }`. |
| 1472 | `d:\Projects\pandittalk-website\src\app\(public)\about\page.tsx` / `how-it-works\page.tsx` / `our-approach\page.tsx` / `contact\page.tsx` / `pricing\page.tsx` / `download\page.tsx` | Key marketing pages omit canonicals (cookie/privacy already have them). — Add matching `alternates.canonical` on each. |
| 1473 | `d:\Projects\pandittalk-website\src\app\(public)\tools\monthly-horoscope\page.tsx` (+ detailed tool pages) | Paused purchase pages are indexable and in the sitemap with soft “paused” titles. — Set `robots: { index: false }` (or noindex) while purchases are closed. |
| 1474 | `d:\Projects\pandittalk-website\src\app\(legal)\cookie-policy\page.tsx` | Has title/description/canonical but no `openGraph`. **Fix:** Add OG title/description/url like privacy/terms. |
| 1475 | `d:\Projects\pandittalk-website\src\app\(legal)\disclaimer\page.tsx` | Same: no `openGraph`. **Fix:** Add OG block. |
| 1476 | `d:\Projects\pandittalk-website\src\app\(legal)\grievance-redressal\page.tsx` | Bare metadata object: no canonical, no `openGraph`. **Fix:** Add `alternates.canonical` + OG. |
| 1477 | `d:\Projects\pandittalk-website\src\app\(legal)\pricing-policy\page.tsx` | No canonical, no `openGraph`. **Fix:** Add both. |
| 1478 | `d:\Projects\pandittalk-website\src\app\(legal)\refund-and-cancellation-policy\page.tsx` | No canonical, no `openGraph`. **Fix:** Add both. |
| 1479 | `d:\Projects\pandittalk-website\src\app\(legal)\delete-account\page.tsx` | No canonical, no `openGraph`. **Fix:** Add both. |
| 1480 | `d:\Projects\pandittalk-website\src\app\robots.ts` | Disallows `/join-as-pandit` while that route only `permanentRedirect`s to `/for-pandits?apply=1` (allowed). **Fix:** Drop disallow or document; ensure crawlers follow redirect to the indexed URL. |
| 1481 | `d:\Projects\pandittalk-website\src\app\(public)\help\page.tsx` | Help index has canonical but no `openGraph` (slug pages do). **Fix:** Add `openGraph: { title, description, url: '/help' }`. |
| 1482 | Pricing policy | pause-first metadata, intro, and Current status first |
| 1483 | `d:\Projects\pandittalk-website\src\app\(public)\tools\page.tsx` | Metadata is title-only; add `description` + `openGraph` (title/url/images). |
| 1484 | `d:\Projects\pandittalk-website\src\app\(customer)\account\profile\page.tsx` | No page metadata; add title/description. |
| 1485 | `d:\Projects\pandittalk-website\src\app\(public)\tools\monthly-horoscope\page.tsx` | Paid tool page has no metadata; add title/description/robots as needed. |
| 1486 | `d:\Projects\pandittalk-website\src\app\page.tsx` | Page-level `openGraph` omits `images` (falls back unevenly); set an explicit share image. |
| 1487 | `d:\Projects\pandittalk-website\src\components\site\SiteFooter.tsx` | Legal group dropped `/pricing-policy` while sitemap/LegalShell still list it; restore footer link or remove everywhere consistently. |
| 1488 | Sitemap omits linked paid-tool URLs | Applied the fix described in the UX improvement loop. |
| 1489 | Guidance deep links | accepts `format`; lands on the right step; status note when params apply; start page has canonical/OG |
| 1490 | Guidance topics | unknown topics `noindex`; “Start with chat draft” deep link + pandits link |
| 1491 | `src/middleware.ts` | Matcher is exact `/profile-setup` (no `:path*`); use `/profile-setup/:path*` (or both) so trailing-slash / nested paths still get `x-customer-path` + noindex. |
| 1492 | `src/app/sitemap.ts` | Flat `priority: 0.6` for everything but `/`; tier e.g. `/pandits`/`/guidance`/`/tools` higher, legal/help lower. |
| 1493 | `src/app/(public)/expert/[id]/page.tsx` + `experts/[id]/page.tsx` | Use `permanentRedirect` (308) for SEO/canonical equity to `/pandits/[id]`. |
| 1494 | `src/app/sitemap.ts` | `/guidance/start` and paid-tool detail URLs share priority with cornerstone pages; demote transactional/utility paths. |
| 1495 | `docs/website-plan/03-SITEMAP-AND-PAGES.md` | Still steers implementers at `landing_page/pandit_registration.html`; point at `PanditApplicationForm` / `/for-pandits#apply` instead. |
| 1496 | `d:\Projects\pandittalk-website\src\app\(public)\pandits\[id]\page.tsx` | Metadata fetch ignores `NEXT_PUBLIC_API_BASE` (sitemap uses it), risking “Pandit profile” titles in SERP. **Fix:** Unify base URL resolution with `API_BASE` helper. |
| 1497 | kundli: horoscope | compatibility — palm-reading — tarot/page.tsx`** — No `metadata` (only hub has title). Fix: unique title + description per tool. |
| 1498 | `src/app/(public)/guidance/start/page.tsx` | No metadata. Fix: `title: 'Prepare a conversation'`. |
| 1499 | Public page metadata** (pricing, trust, download, for-pandits, how-it-works, tools hub) | Titles only; almost no `description`/`openGraph`. Fix: 1-line descriptions for share/SEO. |
| 1500 | Brand string inconsistency | Template `PanditTalk` vs product `Pandit Talk` (`layout.tsx`, legal titles). Fix: one canonical brand in titles. |
| 1501 | Customer + tool page titles/metadata (#5, #22, #4) | Applied the fix described in the UX improvement loop. |
| 1502 | Missing Pandit SEO | `noindex`, canonical `/pandits`, `follow: true` |
| 1503 | `d:\Projects\pandittalk-website\src\app\(public)\help\page.tsx` | metadata is title-only; add `description` + OG for conversion/SEO. |
| 1504 | `d:\Projects\pandittalk-website\src\app\page.tsx` | FAQ UI has “What if something goes wrong?” but FAQPage JSON-LD omits it; add matching `mainEntity` entry. |
| 1505 | `/delete-account?deleted=1` | Confirmed and fixed: dedicated “account deleted” page with next steps (no “Sign in to open deletion”); noindex metadata. |
| 1506 | Fix tarot request body + tool metadata | Completed in the autonomous UX loop. |
| 1507 | brand title template Pandit Talk | Implemented during the UX 500+ goal loop. |
| 1508 | customer/tool/guidance metadata | Implemented during the UX 500+ goal loop. |
| 1509 | metadata/titles | Implemented during the UX 500+ goal loop. |
| 1510 | robots stale paths | Implemented during the UX 500+ goal loop. |
| 1511 | Authors missing expert | Gate soft-404 when expert does not exist |
| 1512 | Customer account pages metadata | Add/fix page titles and metadata |
| 1513 | Home/pricing/trust/download canonicals | Canonicals on major marketing pages |
| 1514 | FAQ/accessibility/editorial OG | OpenGraph where missing |
| 1515 | Sitemap /authors soft-404s | Remove dead author routes from sitemap |
| 1516 | Pandits invalid id soft-404 | notFound() soft-404 |
| 1517 | Journal category soft-404 | Handle unknown categories |
| 1518 | Sitemap priority tiers | Tune priorities for key funnels |
| 1519 | Paid tools noindex | Avoid indexing paused/paid tool dead-ends |
| 1520 | Brand title template not Pandit Talk | Set brand title template to Pandit Talk |
| 1521 | Robots host config | Correct robots host |
| 1522 | FAQ schema/name | FAQPage JSON-LD naming fix |
| 1523 | Account subpage metadata | Metadata on account subpages |
| 1524 | sitemap priority tweaks | Further sitemap priority tuning |
| 1525 | layout JSON-LD | Sitewide JSON-LD polish |
| 1526 | robots legacy paths | Remove legacy paths from robots |
| 1527 | FAQ help page openGraph | OG on FAQ/help |
| 1528 | robots vs sitemap consistency | Align robots and sitemap |
| 1529 | home FAQ schema | FAQ schema on homepage |

## Mobile / nav (129)

| # | Issue | Fix |
|---|---|---|
| 1530 | Pandit apply | Success panel with reference + disable re-submit until “another application”. |
| 1531 | Legal footer / home tiles / route error | skip `#site-content` hints |
| 1532 | Large-text CSS | filters-actions, tarot, kundli, legal-footer, profile-top stack at zoom |
| 1533 | OG image is logo-only sitewide | `src\app\layout.tsx` uses `/logo.png` 512²; most pages inherit; pandit OG has no image (`pandits\[id]\page.tsx`). **Fix:** Add `og-default.png` (1200×630) + page-specific images where useful. |
| 1534 | Pandit application practice/languages | no `autoComplete` / `inputMode`. **Fix:** `autoComplete="organization-title"` / `off` as appropriate. |
| 1535 | Footer missing useful pages | `SiteFooter.tsx`: no Editorial policy in Legal (only bottom line), no Join/apply deep-link (`/for-pandits#apply` / `/join-as-pandit`), Discover omits How it works (it’s under Pandit Talk). **Fix:** Add Editorial + Apply; consider collapsing Legal into “Legal hub”. |
| 1536 | Customer nav horizontal scroll without affordance | `customer.module.css` `.navigation` scroll-x, no fade/hint. **Fix:** Add edge fade or “swipe for more” sr-only text. |
| 1537 | Guidance step rail hidden on small screens | `.guidance-steps { display:none }` at ≤620px leaves only progress label. **Fix:** Keep a compact select/stepper for jump navigation. |
| 1538 | `LegalDocumentPage.tsx` | Mailto sr-only; privacy footer adds grievance email + redressal link |
| 1539 | Footer**: “Find your Pandit” | “Explore Pandits”. |
| 1540 | `src/app/(public)/for-pandits/ForPanditsClient.tsx` | `#apply` section is a `.panel` that nests another `.panel` form → double card chrome. — Make the outer section a plain stack; keep one panel on the form. |
| 1541 | `src/features/pandits/PanditApplicationForm.tsx` | Comma/space-only “Languages” passes `required` but becomes `languages: []` after split/filter. — Validate `languages.length > 0` after parsing. |
| 1542 | `src/features/experts/types.ts` / directory UI | `isOnline` is typed/shown as live presence with no freshness/source, which overclaims “Online now.” — Label as last-known/app presence or hide until backed by a timestamp. |
| 1543 | `src/app/globals.css` | Print rule targets `.navigation`, which never matches the CSS-module customer nav (dead leftover; module has its own print hide). — Remove unused `.navigation` from the global print selector list. |
| 1544 | Desktop + mobile nav | Arrow / Home / End between links; skip still `#site-content` |
| 1545 | `src/components/site/SiteHeader.tsx` (mobile `<details>` ~L75–94) | Applied the fix described in the UX improvement loop. |
| 1546 | `src/features/experts/ExpertDetail.tsx` (~L77–79) | Applied the fix described in the UX improvement loop. |
| 1547 | `src/features/experts/ExpertDetail.tsx` (~L89–113) | Applied the fix described in the UX improvement loop. |
| 1548 | `src/app/(public)/accessibility/page.tsx` + `src/components/site/SiteHeader.tsx` | Applied the fix described in the UX improvement loop. |
| 1549 | `src/app/(public)/join-as-pandit/page.tsx` | Blind `redirect('/for-pandits')` drops `#apply` / query; preserve hash/query or redirect to `/for-pandits#apply`. |
| 1550 | `src/components/legal/legal.css` | Print: legal nav/tabs still print by default; hide `.legal-nav` in `@media print`. |
| 1551 | `src/features/notifications/Notifications.tsx` | `NotificationBadge` exists but is **never imported** by `CustomerNav`; wire unread count into Updates tab. |
| 1552 | Guidance topic | Related topics nav + free-tools link |
| 1553 | Mobile menu CSS | Overflow clipping / wrap for nav links & labels |
| 1554 | Mobile guidance hub | status label Busy (not Offline) |
| 1555 | Legal mobile:** tighter padding, stacked footer links, safer TOC height, and smaller table min-widths on narrow screens | Applied the fix described in the UX improvement loop. |
| 1556 | `d:\Projects\pandittalk-website\src\features\experts\ExpertDirectory.tsx` (`ExpertPortrait`) | Intrinsic `width={85} height={100}` disagrees with CSS `80×96` / profile `150×175`, causing CLS. — Match `width`/`height` to the rendered CSS size (or use `fill` + aspect box). |
| 1557 | `d:\Projects\pandittalk-website\src\features\experts\ExpertDetail.tsx` | Shows `{experience} years` even when `experience === 1` (directory already pluralizes). — Pluralize: `year` / `years`. |
| 1558 | `d:\Projects\pandittalk-website\src\lib\time\ist.ts` | Invalid timestamps format as `Invalid Date IST`. — Guard with `Number.isNaN(date.getTime())` and return a safe fallback string. |
| 1559 | `d:\Projects\pandittalk-website\next.config.ts` | Global headers omit HSTS while middleware already tightens customer routes. — Add `Strict-Transport-Security` for HTTPS deployments. |
| 1560 | `d:\Projects\pandittalk-website\src\app\globals.css` (`.footer-links`) | Four columns put ~9 Legal links in one narrow column; at ≤900px Legal still dominates a half-width cell. — Rebalance columns (e.g. Legal full-width row, or 2×2 Legal split). |
| 1561 | `d:\Projects\pandittalk-website\src\components\site\SiteFooter.tsx` | Support `mailto:` has no subject (contact page does). — Use `mailto:${supportEmail}?subject=…` for consistency. |
| 1562 | `unlockTool` | paid unlock paused (`ServiceUnavailable`); if re-enabled, monthly unlock **requires** a report payload before debit (no charge-without-report). |
| 1563 | Mobile Settings | Help Center → `/help`; Change Phone → `/account/phone`; Contact Us → same support inbox (no more “coming soon”). |
| 1564 | For-pandits dashboard | Clarifies approved-only external workspace + credentials note |
| 1565 | `d:\Projects\pandittalk-website\src\app\page.tsx` | FAQ schema is a second hardcoded list next to the `<details>` copy; easy to drift on edits. **Fix:** Single source array mapped to both schema and UI. |
| 1566 | `d:\Projects\pandittalk-website\src\app\globals.css` (`.home-faq-item summary`) | `margin: 0 -8px` can contribute to horizontal bleed on narrow viewports. **Fix:** Use padding instead of negative margin, or pad the parent. |
| 1567 | `d:\Projects\pandittalk-website\src\features\account\customer.module.css` / `CustomerNav.tsx` | `.navHint` is `display: none` by default while `.navigation` is always `overflow-x: auto`, so tablet/desktop overflow has no swipe cue. **Fix:** Show hint whenever nav can scroll (ResizeObserver / `scrollWidth > clientWidth`), not only `max-width: 620px`. |
| 1568 | `d:\Projects\pandittalk-website\src\features\account\customer.module.css` | At ≤620px, `.navHint` adds `margin: 0 20px` inside `.navWrap` that already has 20px side margin (double indent vs nav). **Fix:** Zero horizontal margin on `.navHint`; let `.navWrap` own spacing. |
| 1569 | `d:\Projects\pandittalk-website\src\app\globals.css` | `overflow-x: clip` only on `html`; `body` unset; older WebKit may ignore `clip`. **Fix:** Also set `body { overflow-x: hidden }` (or `clip`) and avoid negative horizontal margins. |
| 1570 | `d:\Projects\pandittalk-website\src\app\globals.css` | `.site-header` uses side margins (`16px 24px` / `10px 12px`) + sticky; combined with full-bleed children this is a common mobile overflow source. **Fix:** Prefer `padding-inline` on a full-width header wrapper instead of outer margin. |
| 1571 | Mobile directory | status label Available / Busy (not Online / Away) |
| 1572 | `d:\Projects\pandittalk-website\src\middleware.ts` | Sets path header only; no CSP/`Report-To`/`report-uri` for policy violation reporting. |
| 1573 | `d:\Projects\pandittalk-website\next.config.ts` | Security headers lack CSP (and report endpoint); add a report-only CSP if you want observability without breaking pages. |
| 1574 | `d:\Projects\pandittalk-website\src\features\reports\Reports.tsx` | `<main className="page stack">` missing `id="main-content"`. |
| 1575 | `d:\Projects\pandittalk-website\src\features\reports\Reports.tsx` (detail) | `toLocaleString()` → `formatIstDateTime(...)`. |
| 1576 | `d:\Projects\pandittalk-website\src\features\reports\Reports.tsx` (list) | `toLocaleDateString()` → `formatIstDate(...)`. |
| 1577 | `d:\Projects\pandittalk-website\src\app\layout.tsx` | `twitter.card` is `summary_large_image` but `twitter.images` is missing; mirror OG images. |
| 1578 | `d:\Projects\pandittalk-website\src\app\layout.tsx` | OG uses square `/logo.png` for `summary_large_image`; add a ~1200×630 share asset. |
| 1579 | `d:\Projects\pandittalk-website\src\features\pandits\PanditApplicationForm.tsx` | Same spam surface; optional accessible honeypot only. |
| 1580 | `d:\Projects\pandittalk-website\src\features\notifications\Notifications.tsx` | `NotificationBadge` is unused (CustomerNav handles badges); delete or wire it. |
| 1581 | `d:\Projects\pandittalk-website\src\lib\time\ist.ts` | `todayIstIso` is unused; use it in date `min`/`max` fields or remove. |
| 1582 | `d:\Projects\pandittalk-website\tests\ui\journeys.spec.ts` (Pandit application) | Labels/phone UX changed (`Indian mobile number`, +91 prefix); update selectors/fixture so success doesn’t leave a form alert. |
| 1583 | `d:\Projects\pandittalk-website\tests\ui\responsive.spec.ts` (390px) | Overflow on nav/`mobile-nav-label` (“A.” nodes); tighten mobile menu grid/label wrapping in `globals.css` / `SiteHeader.tsx`. |
| 1584 | `d:\Projects\pandittalk-website\tests\ui\responsive.spec.ts` (200% text) | Header/footer links overflow ~865px; allow wrap or hide secondary chrome at large text. |
| 1585 | Pricing-policy related nav | Implemented: Pricing-policy related nav |
| 1586 | Customer nav | Persistent describedby for arrow-key section moves. |
| 1587 | Customer / legal nav:** Arrow-key scroll respects reduced motion. | Applied the fix described in the UX improvement loop. |
| 1588 | Footer columns | `minmax(0,…)` tracks + nav clamp so link text wraps instead of widening the page |
| 1589 | `src/components/site/SiteFooter.tsx` | Copyright year, back-to-top, trust/accessibility/grievance links, clearer operator line |
| 1590 | `src/app/(public)/about/information.css` | Mobile “swipe sideways” hint on cookie/info tables |
| 1591 | `src/app/globals.css`** (`.mobile-menu nav`) | Add `min-width:0` + `overflow-wrap:anywhere` on grid links; collapse to 1 column below ~360–400px so labels like “Find guidance” don’t clip. |
| 1592 | SiteHeader: Label says “Close” but icon stays hamburger | Swap to a close/X icon when open |
| 1593 | ExpertDirectory: Typing search clears the language filter | Stop resetting language on search/topic change |
| 1594 | CustomerNav: “Swipe for more sections” shows even when tabs fit | Show hint only when `scrollWidth > clientWidth` |
| 1595 | Footer bottom support row adds Prepare a draft | Applied the fix described in the UX improvement loop. |
| 1596 | Large-text stacking for legal tabs, confirm dialogs, form action rows, reading/footer | Applied the fix described in the UX improvement loop. |
| 1597 | `d:\Projects\pandittalk-website\src\app\layout.tsx` | `twitter.card` is `summary_large_image` but OG image is `/logo.png` (square logo). **Fix:** Use a real ~1200×630 share image, or switch to `summary`. |
| 1598 | `d:\Projects\pandittalk-website\src\features\experts\ExpertDirectory.tsx` | On mobile, filters start closed with no live region for “filters available,” so directory looks unfilterable. **Fix:** Default open on first visit or add helper text “Tap Filter & sort to search.” |
| 1599 | `src/components/site/SiteHeader.tsx` | Signed-out mobile label “Get started” overpromises. · Rename to “Sign in” (or “Account”). |
| 1600 | Customer nav | live region only when unread count changes (not on first load) |
| 1601 | `src/app/(customer)/home/page.tsx` | No Notifications tile despite CustomerNav “Updates”. Fix: add tile + unread hint. |
| 1602 | `src/features/notifications/Notifications.tsx` | `NotificationBadge` exported but unused in header/nav. Fix: wire unread count into CustomerNav or SiteHeader. |
| 1603 | `src/features/account/CustomerNav.tsx` | 6 equal columns; on mid widths labels truncate awkwardly. Fix: scrollable nav or wrap with clearer active state. |
| 1604 | `src/features/tools/ToolForm.tsx` | Compatibility two-column birth forms cramped on mobile (`grid` without stack). Fix: single column under ~620px. |
| 1605 | `src/features/tools/Reading.tsx` | Kundli 12-house grid heavy on small screens. Fix: accordion or 2-col mobile layout. |
| 1606 | `src/features/guidance/GuidanceFlow.tsx` | Step nav is 6 large buttons; on mobile dominates viewport. Fix: compact stepper (current + Next only) under 620px. |
| 1607 | `src/components/site/SiteFooter.tsx` vs `SiteHeader.tsx` | Footer has Download/Pricing/Trust; desktop nav omits them (only in guest mobile menu). Fix: align secondary links or footer “Get started” group with header. |
| 1608 | `src/features/notifications/schema.ts` | Labels include `chat_now_accepted` / `chat_now_missed` while product says instant chat unavailable. **Fix:** Relabel to “Instant chat (legacy)” or hide those types until feature returns. |
| 1609 | Journal chrome | `ArticleChrome` is a labelled region; print hides filters/share/related; table wraps get swipe hints + better mobile overflow. |
| 1610 | Legal tables | Tighter mobile min-width + `overflow-wrap` on cells. |
| 1611 | Footer link columns stack to one column by 900px (incl. 200% zoom) | Applied the fix described in the UX improvement loop. |
| 1612 | Detail slots | `GET /experts/:id` returns today’s slots (not always `[]`) |
| 1613 | Closed mobile nav no longer layout-overflows (`display:none`); open panel uses contained 2-col grid + softer letter-spacing | Applied the fix described in the UX improvement loop. |
| 1614 | Mobile menu from **1100px**; header `overflow:clip`; resize close at 1101px | Applied the fix described in the UX improvement loop. |
| 1615 | Footer / footer links clipped and wrap under large text | Applied the fix described in the UX improvement loop. |
| 1616 | Customer nav | ←/→/Home/End between sections |
| 1617 | Pandit application | post-submit next steps Arrow / Home / End |
| 1618 | Customer nav | Tab labels wrap instead of overflowing |
| 1619 | `d:\Projects\pandittalk-website\src\app\globals.css` | `.brand { white-space:nowrap }` overflows at 200% text; allow wrap/`min-width:0`/`flex-shrink` on brand + `header-inner`. |
| 1620 | `d:\Projects\pandittalk-website\src\app\globals.css` | `.header-inner`/`.mobile-menu` lack `position:relative`, so absolute menu panel anchors to sticky header; add relative positioning. |
| 1621 | `d:\Projects\pandittalk-website\src\components\site\SiteHeader.tsx` | signed-in “Updates” uses `SiteIcon name="info"` (same as Help); add a bell/updates icon in `SiteIcon.tsx` and use it. |
| 1622 | `d:\Projects\pandittalk-website\src\components\site\SiteHeader.tsx` | header Updates has no unread count (CustomerNav does); surface unread badge or shared count. |
| 1623 | `d:\Projects\pandittalk-website\tests\ui\journeys.spec.ts` | `getByLabel('Phone')` fails; form label is “Indian mobile number” — update selector (and fill `9876543210`, not `+91 …`). |
| 1624 | Pandit apply | phone/name/practice `enterKeyHint` + autofill hygiene |
| 1625 | On mobile, four filter fields bury every Pandit below the fold. Collapsing filters by default so results show first. | Fixed in the UX loop. |
| 1626 | Mobile pandit filters bury results | Completed in the autonomous UX loop. |
| 1627 | PanditApplication +91+ | Implemented during the UX 500+ goal loop. |
| 1628 | CustomerNav badge | Implemented during the UX 500+ goal loop. |
| 1629 | join-as-pandit → for-pandits?apply=1 + scroll | Implemented during the UX 500+ goal loop. |
| 1630 | ExpertDirectory filter hint | Implemented during the UX 500+ goal loop. |
| 1631 | join-as-pandit apply query | Implemented during the UX 500+ goal loop. |
| 1632 | SiteHeader mobile menu | Tab trap / Escape closes menu and restores focus |
| 1633 | ExpertDirectory filtered empty | Clear filters + free tools + draft CTAs |
| 1634 | Directory below-fold availability note | Move availability note below directory on mobile |
| 1635 | Footer/brand link touch targets | Min 44px touch targets |
| 1636 | Mobile pandit filters collapse | Collapse filters by default so results show first |
| 1637 | Mobile header large-text overflow | Prevent overflow at large text sizes |
| 1638 | CustomerNav swipe hint remeasure | Show hint only while overflow remains; remeasure |
| 1639 | Sticky CTA safe-area | Respect safe-area insets on mobile sticky CTA |
| 1640 | Sticky CTA on expert detail missing/weak | Add sticky consult CTA with safe-area |
| 1641 | ExpertDetail instant language claims | Remove/soften dishonest instant-language claims |
| 1642 | CustomerNav unread badge | Wire notifications badge on CustomerNav |
| 1643 | ExpertDetail sticky CSS meta | Sticky CTA CSS polish |
| 1644 | Footer pricing-policy link | Fix/remove broken pricing-policy footer link |
| 1645 | SiteIcon bell | Bell icon for updates/notifications |
| 1646 | Brand wrap header | Prevent brand text wrap issues |
| 1647 | CustomerNav hint a11y | aria-describedby for swipe hint |
| 1648 | Footer top button wrap | Prevent footer top button wrap bugs |
| 1649 | Mobile menu grid overflow | Fix mobile menu overflow |
| 1650 | footer apply query | Footer apply link uses apply query |
| 1651 | for-pandits reduced motion | Reduced motion on for-pandits |
| 1652 | ExpertPortrait sizes | Correct next/image sizes on portraits |
| 1653 | pandit application validation | Stronger PanditApplicationForm validation messages |
| 1654 | ExpertDirectory online labels | Honest online/presence labels |
| 1655 | CustomerNav desktop navHint hidden | Hide desktop navHint appropriately |
| 1656 | globals mobile overflow | Fix horizontal overflow bugs |
| 1657 | ExpertDetail sticky CTA copy | Honest sticky CTA copy |
| 1658 | Directory card free tools/draft | Cards and empty states add free tools/draft CTAs |

## Tools / guidance (113)

| # | Issue | Fix |
|---|---|---|
| 1659 | Profile help | free tools in help row |
| 1660 | Profile DOB max uses UTC | `ProfileForm.tsx` `max={new Date().toISOString().slice(0, 10)}`. **Fix:** Use `en-CA` + `Asia/Kolkata` like tools/guidance. |
| 1661 | Birth city / coordinates lack autocomplete | `ToolForm.tsx` `placeOfBirth` / `coordinates`. **Fix:** `autoComplete="address-level2"` (city); `autocomplete="off"` on coordinates. |
| 1662 | Horoscope `<select name="sign">` no autocomplete | low impact but inconsistent. **Fix:** `autoComplete="off"` explicit. |
| 1663 | Tool birth fields | `enterKeyHint` / `autoCapitalize` / `inputMode` on name, date, time, city, coordinates. |
| 1664 | Tools index notice | `role="status"`. |
| 1665 | Contact shortcuts | draft + free tools links. |
| 1666 | Horoscope API + Reading UI | lucky color/time/number carry a generative-suggestion disclaimer |
| 1667 | `src/features/reports/Reports.tsx` | Print relies on generic global print CSS; long `Reading` panels have no report-specific page-break/typography rules. — Add report print styles (margins, avoid cutting headings mid-panel). |
| 1668 | Customer home overview lists saved reports + free tools | Applied the fix described in the UX improvement loop. |
| 1669 | Tool reading Clear/Print | more tools + draft links |
| 1670 | Phone change | updated/help rows add free tools (+ draft on help) |
| 1671 | Delete account | before/error clusters add free tools + draft |
| 1672 | `src/features/guidance/GuidanceFlow.tsx` (~L114–131) | Applied the fix described in the UX improvement loop. |
| 1673 | Paid-tool document titles | Kundli / compatibility / monthly include **· purchases paused**. |
| 1674 | PaidTool pause UX | explicit no-charge status, pricing/reports/tools paths |
| 1675 | Media reconnect copy | stay-on-page / Pandit-left / reconnect guidance |
| 1676 | Cookie policy:** real inventory (guidance draft + article event guard), “how to clear” section, dropped unused `articles.css` import | Applied the fix described in the UX improvement loop. |
| 1677 | Tarot:** radiogroup card backs + clearer “random Major Arcana” copy | Applied the fix described in the UX improvement loop. |
| 1678 | After free reading** leads with pause + primary “Prepare a draft”. | Applied the fix described in the UX improvement loop. |
| 1679 | Tool results | Post-reading waitlist (`website_after_reading_*`); success copy no longer treats free tools as paid reports |
| 1680 | GuidanceFlow | “Choose an area to continue” when step 0 is blocked |
| 1681 | `d:\Projects\pandittalk-website\src\features\reports\Reports.tsx` | Report type eyebrow is raw `detailed_kundli` → `detailed kundli`. — Map types to human labels (“Detailed Kundli”, etc.). |
| 1682 | `d:\Projects\pandittalk-website\src\features\tools\Reading.tsx` | Dasha / lucky-elements dump raw API keys (`currentMahadasha`, etc.). — Title-case or label-map keys before display. |
| 1683 | `d:\Projects\pandittalk-website\src\features\tools\ToolForm.tsx` | Palm `accept` omits HEIC/HEIF while the type check allows them → confusing OS picker vs error. — Align `accept` with allowed MIME/extensions (or drop HEIC support). |
| 1684 | `d:\Projects\pandittalk-website\src\features\tools\ToolForm.tsx` vs `ProfileForm.tsx` | Tools require `type="time"` IST; profile birth time is free text with no format check. — Add the same time pattern validation (or shared helper) on profile save. |
| 1685 | `d:\Projects\pandittalk-website\src\features\tools\PaidTool.tsx` | H1 is only the tool name; paused state is buried below. — Lead with paused status in H1/eyebrow (“Monthly horoscope · Purchases paused”). |
| 1686 | Reading remedies | traditional ideas only, not prescriptions |
| 1687 | Article reading time | `formatReadTime` with content estimate; no “0 min” |
| 1688 | Zodiac horoscope | `?sign=` deep links, picker + URL sync, monthly pause pointer |
| 1689 | `d:\Projects\pandittalk-website\src\app\(public)\tools\kundli\detailed\page.tsx` | Implemented: `d:\Projects\pandittalk-website\src\app\(public)\tools\kundli\detailed\page.tsx` |
| 1690 | `d:\Projects\pandittalk-website\src\app\(public)\tools\compatibility\detailed\page.tsx` | Implemented: `d:\Projects\pandittalk-website\src\app\(public)\tools\compatibility\detailed\page.tsx` |
| 1691 | `d:\Projects\pandittalk-website\output\ui-results\…guidance…\error-context.md` | Trace artifact `ENOENT`; ensure `output/ui-results` isn’t cleaned mid-run in `playwright.config.ts`. |
| 1692 | Tool birth fields | Pandits + draft next steps grouped |
| 1693 | Account hub: pause notice | waitlist + tools + draft |
| 1694 | Horoscope tool | Dropped duplicate `<select>`; grid + hidden `sign` only. |
| 1695 | Print (tools + reports):** Live status after opening the print dialog. | Applied the fix described in the UX improvement loop. |
| 1696 | Guidance topic | skip on draft/related; pause adds Prepare a draft |
| 1697 | How-it-works pricing/join/format/story | tools/draft + skip |
| 1698 | Large-text stacking for info-card / tool-flow lists / journal-consult / download actions | Applied the fix described in the UX improvement loop. |
| 1699 | Reading next-step hint ids scoped live vs saved (no duplicate id) | Applied the fix described in the UX improvement loop. |
| 1700 | Kundli reading omits the person’s name | Applied the fix described in the UX improvement loop. |
| 1701 | PaidTool list | prepare-draft alternative |
| 1702 | Directory searching | tools/draft while results load |
| 1703 | Help search Clear/Jump row | tools + draft |
| 1704 | Guidance topics:** Meta + on-page pause; “Meet the Pandits” | “Explore Pandits” |
| 1705 | `src/features/account/ProfileForm.tsx` | HEIC guidance, upload status, avatar fallback, reset file input after attempt |
| 1706 | Paid tools:** “Conversation draft” | “Prepare a private draft.” |
| 1707 | Refund policy | attributed waitlist (`website_refund_policy`) + draft/tools paths |
| 1708 | Profile save row adds free tools + draft (hint notes skip `#site-content`) | Applied the fix described in the UX improvement loop. |
| 1709 | Chat live controls include tools/draft beside refund/end/leave | Applied the fix described in the UX improvement loop. |
| 1710 | Media live controls include tools/draft | Applied the fix described in the UX improvement loop. |
| 1711 | Notification per-card actions + prefs shortcut add tools/draft | Applied the fix described in the UX improvement loop. |
| 1712 | ToolForm: HEIC allowed in JS but not in `accept`/copy; often fails after pick | Drop HEIC or fail with a clear “convert to JPEG/PNG” message |
| 1713 | GuidanceFlow: “Start fresh” uses browser `confirm()` | Replace with an in-page confirm panel |
| 1714 | globals: Below ~520px step labels are clipped to numbers only | Keep short labels (Area, Format, etc.) visible on the step buttons |
| 1715 | Signed-in delete form + final confirm add tools/draft next to Keep/Yes | Applied the fix described in the UX improvement loop. |
| 1716 | Guidance clear-confirm adds tools/Pandits; start aside adds “Stay on this draft” | Applied the fix described in the UX improvement loop. |
| 1717 | `d:\Projects\pandittalk-website\src\features\account\ProfileForm.tsx` | Birth-time free text (“10:30 AM”) has no timezone/IST hint, unlike tool/guidance dates. **Fix:** Label as “Birth time (as recorded; IST preferred)” or constrain format. |
| 1718 | Help index pause | free tools + hint before group; contact inboxes + tools/draft |
| 1719 | `src/features/tools/ToolForm.tsx` | Accepts ≤8 MB then errors with “under 300 KB”. · Align error copy with the real compress/size rule. |
| 1720 | `src/features/tools/ToolForm.tsx` (`BirthFields`) | Birth time is required while copy says unknown time needs a Pandit. · Make time optional with an explicit “unknown” path. |
| 1721 | `src/app/globals.css` | Narrow guidance step labels are ellipsis-truncated. · Number-only buttons or allow wrap under ~520px. |
| 1722 | `src/features/tools/Reading.tsx` | Palm keys render as lowercase “life line” / “heart line”. · Title-case line names in the heading. |
| 1723 | `src/features/tools/ToolForm.tsx` | Tarot never sends `card` (or any body) on submit; POSTs `{}` to `/tools/tarot`. Fix: include selected card in request body (or drop card UI if API draws randomly). |
| 1724 | `src/features/tools/Reading.tsx` | Nested `<h2>` under ToolForm’s “Your reading” `<h2>` (broken outline). Fix: demote reading sections to `h3`. |
| 1725 | `src/features/guidance/GuidanceFlow.tsx` | “Start fresh” clears draft with no confirm. Fix: confirm before wipe. |
| 1726 | Tarot request body (#1) | Applied the fix described in the UX improvement loop. |
| 1727 | `src/features/tools/ToolForm.tsx` | Palm upload JPEG-only ≤300 KB; high fail rate on phones (HEIC/large). **Fix:** Accept common formats + client compress, or clearer camera guidance + higher limit if API allows. |
| 1728 | `src/features/tools/Reading.tsx` | Renders `lifeLine` / health-ish sections with only a late general disclaimer. **Fix:** Explicit “not medical / not lifespan” near palm/health blocks. |
| 1729 | Reading next-steps | Arrow / Home / End between post-reading links |
| 1730 | Kundli houses | `minmax(0,…)` + wrap so large text doesn’t overflow |
| 1731 | Guidance / tools / PaidTool | Links into the new help articles from those surfaces. |
| 1732 | Tool coordinate + zodiac alerts labelled for distinct `role="alert"` names | Applied the fix described in the UX improvement loop. |
| 1733 | Help articles | pause adds free tools; support adds grievance path |
| 1734 | Tools free/paused/guidance hints note skip (+ source on paused) | Applied the fix described in the UX improvement loop. |
| 1735 | Guidance-topic pause hint | skip + `source` required |
| 1736 | Home-glance unread row includes free tools + draft | Applied the fix described in the UX improvement loop. |
| 1737 | Guidance format deep-link | format-only links keep format selected and tell the user to choose an area next |
| 1738 | Account + Home FAQ | sign-out row and FAQ help add free tools / prepare draft |
| 1739 | `d:\Projects\pandittalk-website\src\features\guidance\GuidanceFlow.tsx` | “Start fresh” only resets React state; call `clearGuidanceDraft()` so storage is actually cleared. |
| 1740 | Reports / tools | Print/PDF guidance; “Clear reading and start again” on tool results. |
| 1741 | Guidance notes | `enterKeyHint="next"` |
| 1742 | Palm photo replace errors | state that the previous photo was cleared |
| 1743 | Palm reading note | link to disclaimer |
| 1744 | ToolForm:** Renamed duplicate `reading-next-hint` | `tool-reading-next-hint` so IDs stay unique with `Reading`. |
| 1745 | guidance ?area= | Implemented during the UX 500+ goal loop. |
| 1746 | guidance area param | Implemented during the UX 500+ goal loop. |
| 1747 | Guidance clear draft | Expose aria-busy while clearing draft storage |
| 1748 | GuidanceFlow clear-draft confirm | Keyboard hints + Escape dismiss |
| 1749 | Guidance pandit load failure | Recovery retry + explore tools fallback |
| 1750 | Tool pages metadata | Consistent titles + OG; paid tools noindex where needed |
| 1751 | Guidance start/topic metadata | Metadata + booking notice honesty |
| 1752 | Guidance NotifyOpenForm source | Wire notify with required source prop |
| 1753 | Tarot request body / honesty | Fix tarot request body + tool metadata honesty |
| 1754 | Guidance ?area= deep-link | Support guidance area query deep-link |
| 1755 | Guidance start-fresh confirm | Confirm before clearing guidance draft |
| 1756 | Reading h3 outline issues | Fix reading result heading outline |
| 1757 | PaidTool sign-in CTA | Clearer sign-in CTA on paid tools |
| 1758 | BirthFields coord validation | Validate birth coordinates before submit |
| 1759 | Guidance mobile stepper clutter | Hide/simplify mobile stepper |
| 1760 | Compatibility mobile stack | Stack compatibility fields on mobile |
| 1761 | PaidTool notify | Notify path when tool paused |
| 1762 | Tools hub OG | OpenGraph on tools hub |
| 1763 | guidance draft clear button a11y | Accessible clear-draft control |
| 1764 | GuidanceFlow format gate | Gate continue until format chosen |
| 1765 | ToolForm palm compress | Palm image compression before upload |
| 1766 | Reading medical disclaimer | Medical disclaimer on readings |
| 1767 | Tools clear reading clears palms | Clear reading also clears palm photos |
| 1768 | Tools print/PDF on results | Print/PDF actions on tool results |
| 1769 | Reading CTA to another free tool | Post-reading CTA to another free tool |
| 1770 | Guidance explore/review free tools | Add free-tools recovery on guidance empty/error rows |
| 1771 | Guidance Pandit load recovery | Pandit load recovery + empty list recovery |

## Legal / help / contact (138)

| # | Issue | Fix |
|---|---|---|
| 1772 | `help/page.tsx` | Mailto links include sr-only “opens your email app” |
| 1773 | `grievance-redressal/page.tsx` | Grievance mailto button announces email app |
| 1774 | `src/app/(public)/about/InformationPage.tsx` | `intro` is always wrapped in `<p className="lede">`, so any block-level intro becomes invalid HTML. — Render string intros in `<p>`; allow `ReactNode` without forcing a paragraph. |
| 1775 | `src/app/(journal)/articles/[slug]/page.tsx` | Root is `<article id="main-content">`, so article pages lack a `<main>` landmark. — Use `<main>` (optionally wrap an inner `<article>`). |
| 1776 | `src/app/(journal)/articles/[slug]/page.tsx` | Cover `<img>` has no width/height (CLS). — Supply dimensions (or fixed aspect-ratio with reserved space). |
| 1777 | `src/app/(journal)/articles/[slug]/page.tsx` | Open Graph `images` pass raw `coverImageUrl` without `absoluteUrl()`. — Always absolute-ize OG image URLs. |
| 1778 | `src/components/articles/MarkdownBody.tsx` | Missing alt becomes `alt=""`, silently marking possibly meaningful images decorative. — Fallback to a generic “Article illustration” (or require alt upstream). |
| 1779 | `src/components/articles/MarkdownBody.tsx` | Every image forced to `aspectRatio: '16 / 10'` + `object-fit: cover` crops non-16:10 art. — Use natural aspect ratio; constrain `max-width` only. |
| 1780 | `src/components/articles/MarkdownBody.tsx` | Anchors accept any `href` (e.g. `javascript:`) with no protocol allowlist. — Allow only `http(s)`, `mailto:`, and in-site paths. |
| 1781 | `src/components/articles/MarkdownBody.tsx` | Markdown `#` and `##` both render as `<h2>`, flattening heading hierarchy under the page `<h1>`. — Map `#`→`h2`, `##`→`h3`, `###`→`h4`. |
| 1782 | `src/components/articles/MarkdownBody.tsx` | Every table region is labelled identically (“Article table”), so multiple tables are indistinguishable. — Unique labels (caption/order) per table. |
| 1783 | Legal on-this-page TOC | Arrow / Home / End |
| 1784 | Account privacy manage row | Prepare a draft |
| 1785 | `src/components/legal/LegalDocumentPage.tsx` (`RichText`, ~L17–20) | Applied the fix described in the UX improvement loop. |
| 1786 | `src/app/(public)/contact/page.tsx` | `privacy@pandittalk.com` is hardcoded (not in `siteIdentity`); centralize or link `mailto:` like support. |
| 1787 | `src/app/(public)/contact/page.tsx` | Inbox list items aren’t links (privacy/grievance); make them `mailto:`/`Link`s. |
| 1788 | `src/app/(public)/editorial-policy/page.tsx` | Correction path is generic `/contact`; add a dedicated mailto subject for editorial corrections. |
| 1789 | `src/components/articles/MarkdownBody.tsx` | No `width`/`height`/aspect-ratio → CLS on prose images. |
| 1790 | `src/components/articles/MarkdownBody.tsx` | Markdown `h1` not remapped (can break outline under page `h1`); map `h1`→`h2`. |
| 1791 | `src/app/(journal)/articles/page.tsx` | Meta description still says “PanditTalk pandits” (branding inconsistency). |
| 1792 | `src/features/account/ProfileForm.tsx` | No progress/required-vs-optional framing for onboarding; mark birth details as “helpful later, optional now.” |
| 1793 | Help article | Mailto prefilled with topic title + `/help/{slug}` |
| 1794 | Contact shortcuts | subject chips with prefilled mailto body (no sensitive-data ask) |
| 1795 | Chat reconnect copy | draft-safe messaging + link to `/help/chat-reconnect` |
| 1796 | Global error | adds Help centre link + reference wording |
| 1797 | Journal categories | Active chip scrolls into view (honours reduced motion) |
| 1798 | `d:\Projects\pandittalk-website\src\app\(legal)\delete-account\page.tsx` vs `src\app\(customer)\account\delete\page.tsx` | Two “Delete account” URLs with different shells/copy confuse support links. — Make the public page the explainer only; deep-link customer flow with clearer naming. |
| 1799 | `d:\Projects\pandittalk-website\src\app\(legal)\cookie-policy\page.tsx` | Cookie table uses `journal-table-wrap` outside journal chrome; Legal already has `legal-table-wrap`. — Prefer `legal-table-wrap` for consistent legal styling/overflow. |
| 1800 | `d:\Projects\pandittalk-website\src\components\legal\ThemeToggle.tsx` + `src\lib\theme.tsx` | Orphaned dark-mode toggle/provider (unused; `useTheme` would throw) leave a dead alternate theme path. — Remove the unused theme stack or wire a real provider only if product wants it. |
| 1801 | LegalDocumentPage | Active TOC link scrolls into view; “Skip to document” jump |
| 1802 | ContactQuickActions | Mailto includes previous same-origin page path |
| 1803 | Article share | Share / Copy / Hide link in one Arrow / Home / End set |
| 1804 | `d:\Projects\pandittalk-website\src\app\(public)\about\InformationPage.tsx` | `intro` is always wrapped in `<p className="lede">`, so multi-paragraph / block intros become invalid HTML. **Fix:** Render intro in a `<div className="lede">` (or only wrap when `typeof intro === 'string'`). |
| 1805 | `d:\Projects\pandittalk-website\src\components\articles\ArticleCard.tsx` | Cover uses raw `<img>` without dimensions/`sizes`; CLS and responsive density suffer. **Fix:** Switch to `next/image` with width/height or `fill` + `sizes`. |
| 1806 | Article share | Hide link included in arrow move set |
| 1807 | `d:\Projects\pandittalk-website\src\app\(public)\help\[slug]\page.tsx` | Help OG has no `images`. |
| 1808 | `d:\Projects\pandittalk-website\src\app\(public)\help\[slug]\page.tsx` | No related-topic links; add 2–3 sibling help links under the tip. |
| 1809 | `d:\Projects\pandittalk-website\src\features\account\Account.tsx` | “Get account help” → `/help` should be `/help/account-access`. |
| 1810 | `d:\Projects\pandittalk-website\src\features\account\Account.tsx` | “Contact support” → `/help` should be `/contact`. |
| 1811 | `d:\Projects\pandittalk-website\src\app\(legal)\pricing-policy\page.tsx` | Mojibake `â€”` / `â†’`; replace with `—` / `→`. |
| 1812 | `d:\Projects\pandittalk-website\src\app\(legal)\delete-account\page.tsx` | Mojibake `â€”`. |
| 1813 | `d:\Projects\pandittalk-website\src\app\(legal)\grievance-redressal\page.tsx` | Mojibake `â†—` / `â†’`. |
| 1814 | `d:\Projects\pandittalk-website\src\app\globals.css` (`.prose …`) | Legacy `.prose` rules unused (`journal-prose` / `legal-main` replaced them); delete dead CSS. |
| 1815 | Grievance: contact / everyday / policies | Implemented: Grievance: contact / everyday / policies |
| 1816 | Help articles: pause / next steps / email support | Implemented: Help articles: pause / next steps / email support |
| 1817 | Help index pause alternatives | Implemented: Help index pause alternatives |
| 1818 | Download help next steps | Implemented: Download help next steps |
| 1819 | Disclaimer trust span | Implemented: Disclaimer trust span |
| 1820 | Journal categories | SR hint: arrow keys move between chips. |
| 1821 | Delete-account prep/stay + pricing-policy related + Home FAQ help | skip notes |
| 1822 | Accessibility | Report mailto + contact + help grouped; notes recorded |
| 1823 | Markdown table labels use module-global counter | Applied the fix described in the UX improvement loop. |
| 1824 | Help related maps | shared `src/content/help.ts`, `relatedHelpFor()`, `generateStaticParams`; index + slug stay in sync |
| 1825 | Help centre + articles:** Index/cancel/join/reconnect framed as existing-only; journal meta ≠ live consult | Applied the fix described in the UX improvement loop. |
| 1826 | Refund / contact / approach / trust / account meta:** Pause or existing-only framing in titles/intros | Applied the fix described in the UX improvement loop. |
| 1827 | Article share | Arrow / Home / End between Share and Copy |
| 1828 | `src/app/(customer)/account/privacy/page.tsx` | Phone, grievance, terms, and public deletion paths |
| 1829 | `src/components/articles/ArticleShare.tsx` (+ article page/CSS) | Share/copy with explicit “we don’t post for you” confirmation |
| 1830 | `src/content/siteIdentity.ts` | Export `privacyEmail` / `grievanceEmail`; stop hardcoding in contact + account privacy pages. |
| 1831 | `src/app/(public)/contact/page.tsx` | Replace local `privacy@…` with `privacyEmail` from siteIdentity. |
| 1832 | `src/app/(customer)/account/privacy/page.tsx` | Same: use centralized `privacyEmail`. |
| 1833 | `src/app/(legal)/grievance-redressal/page.tsx`** + **`src/content/legal/privacy.ts` | Route `grievance@…` through siteIdentity to avoid drift. |
| 1834 | `src/app/(journal)/articles/page.tsx` | Pass `featured` on the first/latest card; prop + CSS exist but are never used. |
| 1835 | `src/app/(journal)/layout.tsx` | Inline `fontFamily: … system-ui` fights root Instrument Sans; apply `--font-hi` via class only, keep brand body font. |
| 1836 | `src/app/(public)/about/InformationPage.tsx` | Optional `breadcrumb` / back slot (help slug already has `info-back`; most info pages have none). |
| 1837 | Help first-consultation | Retitled “Preparing for a consultation”; pause-first summary/steps (no “book now” framing) |
| 1838 | `d:\Projects\pandittalk-website\src\content\legal\privacy.ts` | Privacy policy routes privacy questions to `grievance@` and never mentions `privacy@pandittalk.com`, while Contact/Account do. **Fix:** Align all privacy-contact copy to `privacyEmail` / `grievanceEmail` from `siteIdentity.ts`. |
| 1839 | `d:\Projects\pandittalk-website\src\app\(public)\contact\page.tsx` + `src\content\siteIdentity.ts` | Contact advertises `privacy@pandittalk.com` that legal docs ignore, so users may email a dead or mismatched inbox. **Fix:** Use one shared privacy address everywhere (prefer the legally published one). |
| 1840 | `d:\Projects\pandittalk-website\src\features\account\ProfileForm.tsx` | “Contact support” links to `/help/account-access` (not support). **Fix:** Link to `/contact` or say “Get account help” to match the destination. |
| 1841 | `d:\Projects\pandittalk-website\src\components\legal\LegalDocumentPage.tsx` | Autolink regex covers `admininfo@` and `grievance@` but not `privacy@`. **Fix:** Include `privacy@pandittalk.com` (or all `*@pandittalk.com`). |
| 1842 | `d:\Projects\pandittalk-website\src\content\legal\privacy.ts` | Still says privacy questions go to grievance only even in §13 Contact, conflicting with product UI. **Fix:** Publish `privacy@` (or stop advertising it on Contact/Account). |
| 1843 | Our approach | Added three commitments + “what this is not” with disclaimer/trust links |
| 1844 | Article share | “Hide link field” when clipboard fallback is shown |
| 1845 | `src/app/layout.tsx` title template** + legal titles (e.g. **`src/app/(legal)/privacy/page.tsx`**) | `"Privacy Policy — PanditTalk"` + `"%s · PanditTalk"` → doubled brand. Fix: use short segment titles (`Privacy Policy`) or `absolute` titles. |
| 1846 | `src/app/(public)/help/[slug]/page.tsx` | “Related help” is `Object.entries(...).slice(0, 3)` (arbitrary order), not topical. **Fix:** Explicit related map per slug. |
| 1847 | `src/app/(public)/help/page.tsx` | Routes privacy + grievance to `supportEmail` only. **Fix:** Split to privacy/grievance mailto links like contact page. |
| 1848 | `src/app/(public)/contact/page.tsx` | “We aim to reply within two business days” without published SLA elsewhere. **Fix:** Soften to “we aim to reply soon” or publish the SLA on trust/help. |
| 1849 | Cookie policy | Arrow / Home / End on storage links; attributed waitlist (`website_cookie_policy`) |
| 1850 | Profile `formGrid` stacks from 900px; journal category chips scroll instead of overflowing | Applied the fix described in the UX improvement loop. |
| 1851 | Journal article | Category eyebrow links to filtered list |
| 1852 | Contact shortcuts | privacy/data-rights mailto uses privacy inbox |
| 1853 | Legal tabs/TOC | Honor `prefers-reduced-motion` on scroll-into-view |
| 1854 | `d:\Projects\pandittalk-website\src\app\(public)\help\page.tsx` + `help\[slug]\page.tsx` | article list duplicated inline; extract `src\content\help\index.ts` as single source. |
| 1855 | `d:\Projects\pandittalk-website\src\app\(public)\help\[slug]\page.tsx` | “Related help” is first 3 Object.entries, not topical; define related slugs per article. |
| 1856 | `d:\Projects\pandittalk-website\src\app\(legal)\cookie-policy\page.tsx` | uses `.journal-table-wrap` but never loads `articles.css`; import shared table styles or switch to `.legal-table-wrap`. |
| 1857 | `d:\Projects\pandittalk-website\src\components\articles\articles.css` | journal filter chips/`nowrap` risk overflow at large text; allow wrap and shrink on `.journal-filter`. |
| 1858 | `d:\Projects\pandittalk-website\src\components\site\SiteIcon.tsx` | unused `arrow`/`lock` paths; either use (Updates/Help) or remove to reduce dead icon surface. |
| 1859 | Contact shortcuts | Email body includes optional “page you were on”. |
| 1860 | Home large text | story steps columnize; numbered lines / topic links wrap; editorial mark clips at ≤900px |
| 1861 | Profile help | contact / account-help row described |
| 1862 | Contact shortcuts:** Arrow / Home / End between mailto subject buttons | Applied the fix described in the UX improvement loop. |
| 1863 | privacy/terms titles | Implemented during the UX 500+ goal loop. |
| 1864 | journal nested main | Implemented during the UX 500+ goal loop. |
| 1865 | cookie inventory | Implemented during the UX 500+ goal loop. |
| 1866 | legal titles | Implemented during the UX 500+ goal loop. |
| 1867 | privacy email alignment | Implemented during the UX 500+ goal loop. |
| 1868 | LegalDocumentPage mailto regex | Implemented during the UX 500+ goal loop. |
| 1869 | featured ArticleCard | Implemented during the UX 500+ goal loop. |
| 1870 | ExpertDetail journal link→/articles | Implemented during the UX 500+ goal loop. |
| 1871 | privacy emails | Implemented during the UX 500+ goal loop. |
| 1872 | featured articles | Implemented during the UX 500+ goal loop. |
| 1873 | ExpertDetail journal→articles | Implemented during the UX 500+ goal loop. |
| 1874 | error/global-error contact+digest | Implemented during the UX 500+ goal loop. |
| 1875 | MarkdownBody local tableCount | Implemented during the UX 500+ goal loop. |
| 1876 | ArticleShare share/copy buttons | Expose aria-busy while share/copy is in flight |
| 1877 | Journal list empty | Empty state with explore guidance/tools |
| 1878 | Legal privacy/terms/cookie titles | Correct titles; remove mojibake |
| 1879 | Help articles OG | OG + related links map |
| 1880 | Legal effective dates | Consistent date formatting |
| 1881 | Journal article dates IST | IST-safe article dates |
| 1882 | Legal/privacy tables mobile | Table wrap/overflow fixes |
| 1883 | Cookie policy tables mobile | legal-table-wrap on mobile |
| 1884 | Help slug mismatches | Fix help slugs vs content index |
| 1885 | Help/legal pages not using InformationPage | Migrate help/legal to InformationPage pattern |
| 1886 | MarkdownBody accessibility gaps | Improve MarkdownBody a11y (headings, tables, links) |
| 1887 | Author CTAs weak | Stronger author profile CTAs |
| 1888 | Journal nested main landmarks | Remove nested mains in journal layout |
| 1889 | Cookie inventory incomplete | Document cookie inventory on policy page |
| 1890 | Privacy page rewrite | Rewrite account/legal privacy clarity |
| 1891 | Help related links map | Add related article links on help |
| 1892 | Help OG images | OpenGraph for help articles |
| 1893 | IST helpers | Shared IST formatting helpers |
| 1894 | Journal CSS polish | Journal reading CSS polish |
| 1895 | content/help index | Fix help content index consistency |
| 1896 | Author empty h3 | Fix empty author heading |
| 1897 | articles.css cookie import | Fix articles.css import issues |
| 1898 | Privacy email centralization | Centralize privacy email in siteIdentity |
| 1899 | ConsultCta first-name | Use first name in consult CTA when known |
| 1900 | ArticleCard featured prop | Support featured article card treatment |
| 1901 | InformationPage breadcrumb | Breadcrumb on InformationPage |
| 1902 | privacy session cookie copy | Honest session cookie copy |
| 1903 | MarkdownBody safe hrefs | Sanitize/safe-check markdown hrefs |
| 1904 | article main landmark | Single main landmark on article pages |
| 1905 | editorial honesty | Editorial policy honesty copy |
| 1906 | InformationPage intro wrapping | Fix intro wrapping |
| 1907 | legal pages missing openGraph | Add OG to legal pages |
| 1908 | ArticleShare aria-busy | Share/Copy expose aria-busy |
| 1909 | delete-account?deleted=1 handling | Handle deleted query on public delete-account page |

## Monorepo / API (14)

| # | Issue | Fix |
|---|---|---|
| 1910 | Profile birth place | autocomplete / capitalize / `enterKeyHint`. |
| 1911 | Chat Now API | `createChatNow` refused the same way |
| 1912 | `src/app/(journal)/articles/[slug]/page.tsx` | `CATEGORY_LABELS[article.category]` can render `undefined` for unexpected API categories. — Fallback label (e.g. prettified slug) when missing. |
| 1913 | `src/components/articles/ArticleCard.tsx` | `featured` prop unused in listing; either use for first card or remove dead API. |
| 1914 | `d:\Projects\pandittalk-website\.env.example` | `BACKEND_URL` / `API_BASE` / `NEXT_PUBLIC_API_BASE` triple with no usage note. **Fix:** Document server proxy vs client/articles base (`server.ts` vs `site.ts`). |
| 1915 | `d:\Projects\pandittalk-website\docs\website-plan\00-START-HERE.md` (and siblings) | Still point at monorepo paths like `apps/backend/...` that do not exist in this website checkout. **Fix:** Add a banner that paths are reference-monorepo only, or rewrite to API contracts in this repo. |
| 1916 | `src/features/account/StoryContext.tsx` | Sharing a private story has no confirm step. · `confirm()` (or dialog) before the share API call. |
| 1917 | BACKEND_URL fallback | Implemented during the UX 500+ goal loop. |
| 1918 | API review aggregates honesty | Exclude placeholder reviewers from rating/total_reviews |
| 1919 | Monorepo seed-rating honesty | Backend seed-rating exclusion for public APIs |
| 1920 | Types price_per_session leakage | Remove UI leakage of price_per_session |
| 1921 | available_slots_today UI leakage | Stop exposing misleading slots UI |
| 1922 | api 401 redirect | UX-friendly 401 redirect handling |
| 1923 | Monorepo booking/queue charge refusal | Refuse misleading queue/booking charges in API |

## Performance / infra (75)

| # | Issue | Fix |
|---|---|---|
| 1924 | Dead ComingSoon + WaitlistForm | `ComingSoon.tsx` / `WaitlistForm.tsx` unused by any page. **Fix:** Remove or wire one entry route intentionally. |
| 1925 | Twitter card weak | layout `twitter: { card: 'summary' }` with no images. **Fix:** Use `summary_large_image` + shared OG asset. |
| 1926 | Chat composer | 2000-char limit + live count. |
| 1927 | `src/app/page.tsx` | Home FAQ `<details name="home-faq">` relies on exclusive-accordion `name`, which older browsers ignore so multiple answers can stay open. — Add a small JS/CSS fallback or remove `name` and document multi-open as intentional. |
| 1928 | `src/components/articles/articles.css` | No print rules; `@media print` hides `.journal-consult` but leaves a two-column `.journal-detail` gap. — Force single-column print layout for `.journal-detail`. |
| 1929 | Accessibility page updated for the above | Applied the fix described in the UX improvement loop. |
| 1930 | `tsc --noEmit` passed | Applied the fix described in the UX improvement loop. |
| 1931 | Accessibility changelog | documents this batch |
| 1932 | `src/app/(public)/download/page.tsx` (~L26) | Applied the fix described in the UX improvement loop. |
| 1933 | `src/app/(public)/accessibility/page.tsx` | Claims reduced-motion support, but `src/components/Lightfall.tsx` has no `prefers-reduced-motion` gate (canvas still runs). Respect reduced motion or stop claiming it. |
| 1934 | `src/app/(public)/accessibility/page.tsx` | Feedback is mailto-only with no subject/template (“Accessibility issue: [page]”); prefill `mailto:?subject=…`. |
| 1935 | `src/app/globals.css` | Global reduced-motion kills CSS animation, but presence “online” uses a glow box-shadow that still reads as attention chrome; tone down for reduced motion. |
| 1936 | `d:\Projects\pandittalk-website\src\middleware.ts` vs `next.config.ts` | Customer routes send `X-Frame-Options: DENY`; global config uses `SAMEORIGIN`. — Unify framing policy (prefer DENY everywhere unless embeds are required). |
| 1937 | `security.ts` | comment so pause routes stay allow-listed for 503 handlers. |
| 1938 | `d:\Projects\pandittalk-website\.env.example` | `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, and `APP_ORIGIN` look interchangeable with no “which wins / when”. **Fix:** Comment precedence (see `site.ts` / `requestOrigin`) and when each must match Vercel. |
| 1939 | Accessibility | documents those waitlist forms |
| 1940 | Accessibility | attributed waitlist (`website_accessibility`) + docs |
| 1941 | `d:\Projects\pandittalk-website\README.md` | Still documents waitlist `WaitlistForm`; rewrite for the live site. |
| 1942 | Accessibility “Recent improvements” updated for this batch | Applied the fix described in the UX improvement loop. |
| 1943 | Related layout | `auto-fit`/`minmax` so cards wrap under large text |
| 1944 | Unread badge can disagree with the list | Applied the fix described in the UX improvement loop. |
| 1945 | Reports “Print or save as PDF” leaves chrome in print | Applied the fix described in the UX improvement loop. |
| 1946 | Orphan waitlist leftovers (launch-era copy / second pipe) | Applied the fix described in the UX improvement loop. |
| 1947 | Download / iOS | detects iPhone/iPad, leads with honest “not on App Store yet” waitlist, Android second |
| 1948 | `src/components/ComingSoon.tsx` | Still imports deleted `WaitlistForm.tsx` (also `D` in git); remove ComingSoon or restore form — currently a break risk. |
| 1949 | How it works | Formats (`#formats`) and after-conversation (`#after-conversation`) sections |
| 1950 | Reports list | Arrow / Home / End between saved report cards |
| 1951 | `src/app/(public)/for-pandits/ForPanditsClient.tsx` | `scrollIntoView({ behavior: 'smooth' })` ignores `prefers-reduced-motion`. **Fix:** Use `auto` when reduced-motion is set. |
| 1952 | `src/app/layout.tsx` | OG/Twitter image is square `logo.png`; weak share cards. **Fix:** Dedicated 1200×630 brand image. |
| 1953 | Accessibility docs | recorded the new behaviors |
| 1954 | How-it-works find step adds trust claim-check link | Applied the fix described in the UX improvement loop. |
| 1955 | Accessibility changelog updated for this loop | Applied the fix described in the UX improvement loop. |
| 1956 | Accessibility changelog updated; `tsc --noEmit` passed | Applied the fix described in the UX improvement loop. |
| 1957 | Website `tsc` + **14/14** contract tests · user-service `tsc` clean | Applied the fix described in the UX improvement loop. |
| 1958 | `npm run build:user-service` | Implemented: `npm run build:user-service` |
| 1959 | `d:\Projects\pandittalk-website\playwright.config.ts` | no `webServer`, defaults to `:3100` vs Next `:3000`; add `webServer` + align `baseURL`/`UI_BASE_URL`. |
| 1960 | `d:\Projects\pandittalk-website\package.json` | no `test:ui`/playwright script; add npm script for `playwright test`. |
| 1961 | `d:\Projects\pandittalk-website\README.md` | still titled “waitlist” and points at deleted `WaitlistForm.tsx`; rewrite for the live marketing/app site + env/scripts. |
| 1962 | `d:\Projects\pandittalk-website\src\components\ComingSoon.tsx` + `WaitlistForm.tsx` | deleted on disk but still in git (`D`); stage deletion so the tree matches reality (no live imports found). |
| 1963 | `d:\Projects\pandittalk-website\src\components\articles\articles.css` | no reduced-motion rule for non-card journal motion (if any hover transforms remain elsewhere); mirror article-card reduce rules for filters/consult. |
| 1964 | `d:\Projects\pandittalk-website\landing_page\` | orphan waitlist microsite still in repo; archive/remove or document so it doesn’t compete with Next app messaging. |
| 1965 | Accessibility changelog updated for this pass | Applied the fix described in the UX improvement loop. |
| 1966 | `tsc --noEmit` | Passes. |
| 1967 | Accessibility page documents this batch | Applied the fix described in the UX improvement loop. |
| 1968 | Accessibility | recent-improvements note for this batch |
| 1969 | Our approach | boundary + next-steps hints |
| 1970 | Accessibility | changelog entry for this batch |
| 1971 | Home FAQ hint:** Documents Home / End | Applied the fix described in the UX improvement loop. |
| 1972 | Schema/support email inconsistency | Completed in the autonomous UX loop. |
| 1973 | next highest-impact improvement | Completed in the autonomous UX loop. |
| 1974 | start-fresh confirm | Implemented during the UX 500+ goal loop. |
| 1975 | home Updates tile | Implemented during the UX 500+ goal loop. |
| 1976 | phone +91 fields | Implemented during the UX 500+ goal loop. |
| 1977 | Lightfall reduced motion | Implemented during the UX 500+ goal loop. |
| 1978 | priority tiers | Implemented during the UX 500+ goal loop. |
| 1979 | twitter card summary | Implemented during the UX 500+ goal loop. |
| 1980 | ComingSoon/WaitlistForm deleted | Implemented during the UX 500+ goal loop. |
| 1981 | noopener links | Implemented during the UX 500+ goal loop. |
| 1982 | twitter summary | Implemented during the UX 500+ goal loop. |
| 1983 | ComingSoon deleted | Implemented during the UX 500+ goal loop. |
| 1984 | Reports no-print | Implemented during the UX 500+ goal loop. |
| 1985 | Print CSS hides wrong content | Print styles hide chrome, keep content |
| 1986 | ComingSoon/Waitlist/QueuePanel dead code | Delete dead ComingSoon/Waitlist/QueuePanel |
| 1987 | next.config security headers | Add security headers (HSTS/Permissions-Policy etc.) |
| 1988 | README outdated waitlist | Update README away from waitlist framing |
| 1989 | Playwright config/selectors | Update journeys selectors for phone labels |
| 1990 | middleware matcher profile-setup | Include profile-setup in middleware matcher |
| 1991 | Play Store noopener | rel=noopener on store links |
| 1992 | ThemeToggle deleted | Remove unused ThemeToggle |
| 1993 | IST invalid dates | Guard invalid dates in IST formatters |
| 1994 | HSTS/Permissions-Policy | Add HSTS and Permissions-Policy headers |
| 1995 | useApi stale data | Prevent stale data flicker in useApi |
| 1996 | .env.example clarity | Clarify env example for notify/backend |
| 1997 | README accuracy | Update README for current product |
| 1998 | NEXT_PUBLIC_NOTIFY_SHEET_URL fallback | Sensible fallback when notify sheet URL unset |

