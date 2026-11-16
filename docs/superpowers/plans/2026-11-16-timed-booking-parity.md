# Timed Booking Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the website support backend-backed timed scheduled bookings and Chat Now with parity to the mobile app, while preserving legacy booking terms.

**Architecture:** Centralize timed booking rules in the backend catalog/quote service. Add a public read-only catalog/quote contract, then make the website consume that contract plus the existing expert, availability, wallet, booking, and session endpoints through the same-origin proxy. Build the scheduled audio vertical slice first, reuse its summary/confirmation contract for video and scheduled chat, and add Chat Now as a separate online/busy/queue path.

**Tech Stack:** NestJS/Prisma backend, Next.js App Router, React client components, existing same-origin API proxy, Socket.IO, browser WebRTC, Playwright/contract tests.

**Spec:** `docs/superpowers/specs/2026-11-16-timed-booking-parity.md`

## Global Constraints

- Backend quote, availability, wallet, and booking services are authoritative; do not duplicate price decisions or simulate success in the website.
- New bookings use `legacy_timed`; `no_timer` remains rejected until a separately approved service contract exists.
- Existing bookings retain their stored duration, price, and session model.
- Notes are optional booking data, not a primary hero action.
- Keep existing authentication, same-origin proxy, session bootstrap, legal routes, and unrelated user changes intact.
- Support desktop and 360px mobile without horizontal overflow; respect reduced motion and keyboard access.

## Review Focus

- Backend quote differs from a stale client catalog: UI must show the returned total and submit no client-calculated price.
- Slot conflict or timeout after the user confirms: surface uncertainty, refresh current state, and never submit a second charge automatically.
- Chat Now Pandit goes offline/busy or queue expires: keep charge/refund messaging tied to backend responses.
- Session timer reconnects or the tab is backgrounded: resume from server timestamps/events, not a locally extended countdown.
- Existing timed booking opens after the copy migration: keep its original duration/model and recovery links.

---

### Task 1: Backend catalog and booking contract

**Files:**
- Create: `pandittalk-backend/apps/user-service/src/bookings/booking-catalog.ts`
- Create: `pandittalk-backend/apps/user-service/src/bookings/booking-catalog.controller.ts`
- Modify: `pandittalk-backend/apps/user-service/src/bookings/bookings.module.ts`
- Modify: `pandittalk-backend/apps/user-service/src/bookings/bookings.service.ts`
- Modify: `pandittalk-backend/apps/user-service/src/bookings/bookings.controller.ts`
- Modify: `pandittalk-backend/apps/user-service/src/bookings/dto/create-booking.dto.ts`
- Test: `pandittalk-backend/apps/user-service/src/bookings/booking-catalog.spec.ts`

**Interfaces:**
- Produce public `GET /booking-catalog` with areas, scheduled depth/format options, Chat Now rules, and cancellation/session policy values.
- Produce public `GET /booking-catalog/quote?depth=<entry|standard|deep>&format=<chat|audio|video>` returning `{ sessionModel, depth, format, durationMinutes, totalPrice, coinsDeducted }`.
- Keep `POST /bookings` and `POST /bookings/chat-now` response values authoritative and computed from the same catalog module.
- Preserve `legacy_timed` default and reject `no_timer`.

- [ ] Write failing unit tests for all depth/format totals, durations, Chat Now values, invalid options, and legacy/no-timer behavior.
- [ ] Run the focused backend booking tests and confirm the new contract fails before implementation.
- [ ] Implement the shared catalog module and public controller without exposing user data.
- [ ] Refactor booking creation to use catalog functions for charge/duration values.
- [ ] Run focused tests and backend typecheck/lint.

### Task 2: Website proxy and typed booking adapter

**Files:**
- Modify: `pandittalk-website/src/lib/api/security.ts`
- Modify: `pandittalk-website/src/app/api/backend/[...path]/route.ts`
- Create: `pandittalk-website/src/features/bookings/bookingApi.ts`
- Modify: `pandittalk-website/src/features/bookings/types.ts`
- Test: `pandittalk-website/tests/contracts/booking-parity.test.ts`

**Interfaces:**
- Allow only catalog/quote, expert all-slots/status, booking creation/detail/status/reschedule, queue, wallet, and WebRTC join paths required by the flow.
- Forward `X-Client-Platform: web` to the backend.
- Expose typed helpers for `getBookingCatalog`, `getBookingQuote`, `getAllSlots`, `getPanditStatus`, `createScheduledBooking`, `createChatNow`, and queue actions.

- [ ] Add failing contract tests for allowed/denied paths, web platform forwarding, and no simulated success.
- [ ] Implement the allowlist/proxy changes and adapter normalization.
- [ ] Run website contract tests and `git diff --check`.

### Task 3: Scheduled audio vertical slice

**Files:**
- Create: `pandittalk-website/src/features/bookings/BookingFlow.tsx`
- Create: `pandittalk-website/src/features/bookings/booking-flow.module.css`
- Modify: `pandittalk-website/src/app/(customer)/bookings/new/page.tsx`
- Modify: `pandittalk-website/src/features/experts/ExpertDetail.tsx`
- Test: `pandittalk-website/tests/ui/timed-booking.spec.ts`

**Interfaces:**
- The flow accepts an optional `expertId` and `mode` query, loads the catalog/expert, selects depth/topic/format/date/slot, and renders an optional notes field.
- The review step displays the backend quote, duration, total coins, wallet status, and cancellation/refund summary before confirmation.
- Successful creation navigates to `/bookings/:id`; errors preserve selections and offer safe retry/refresh.

- [ ] Write failing Playwright tests for desktop and 360px scheduled audio selection, quote visibility, optional notes, and final POST response handling.
- [ ] Implement the first end-to-end scheduled audio path using only backend data.
- [ ] Run the focused UI test against a local preview/staging configuration and fix responsive overflow.

### Task 4: Other scheduled formats and Chat Now

**Files:**
- Modify: `pandittalk-website/src/features/bookings/BookingFlow.tsx`
- Modify: `pandittalk-website/src/features/experts/ExpertDetail.tsx`
- Modify: `pandittalk-website/src/features/bookings/BookingViews.tsx`
- Modify: `pandittalk-website/src/features/bookings/QueuePanel.tsx`
- Test: `pandittalk-website/tests/ui/timed-booking.spec.ts`

- [ ] Add video and scheduled chat formats through the same quote/slot flow.
- [ ] Add Chat Now status, confirmation, queue join/leave, busy, offline, insufficient-wallet, and queue-expired recovery.
- [ ] Add booking detail actions for reschedule, cancel/refund, and session links without changing existing booking terms.
- [ ] Run focused UI tests at 360px, 768px, 1024px, and desktop widths.

### Task 5: Session timer, refund, and recovery parity

**Files:**
- Modify: `pandittalk-website/src/features/sessions/ChatRoom.tsx`
- Modify: `pandittalk-website/src/features/sessions/MediaRoom.tsx`
- Modify: `pandittalk-website/src/features/sessions/SessionPage.tsx`
- Modify: `pandittalk-website/src/features/sessions/events.ts`
- Test: `pandittalk-website/tests/ui/session-parity.spec.ts`

- [ ] Add failing tests for server `sessionStarted`, `timeRemaining`, `sessionTimeUp`, waiting timeout/refund, disconnect/reconnect, and 90-second grace copy.
- [ ] Render an accessible countdown from server events with a warning state and no local extension of the end time.
- [ ] Keep leave/rejoin separate from end/cancel and reflect wallet refund events explicitly.
- [ ] Verify media join endpoints are reachable through the proxy and session recovery never creates a new booking.

### Task 6: Copy migration and responsive release evidence

**Files:**
- Modify: `pandittalk-website/src/content/availability.ts`
- Modify: `pandittalk-website/src/content/help.ts`
- Modify: booking/public/profile/how-it-works/pricing copy containing paused/No Timer/opening-soon messaging.
- Create: `docs/implementation/timed-booking-parity-evidence.md`
- Test: `pandittalk-website/tests/ui/timed-booking.spec.ts`

- [ ] Replace live booking-surface No Timer/opening-soon/draft-only claims with clear timed scheduled + Chat Now language; retain legacy wording only for existing-booking explanations.
- [ ] Capture responsive screenshots and inspect 360px/390px mobile, tablet, 1024px, and desktop hierarchy.
- [ ] Run backend tests, website lint/build, contract tests, and focused Playwright tests.
- [ ] Record live read-only endpoint evidence, parity matrix, known deployment prerequisites, and release blockers; do not claim release until deployed backend and real authenticated test credentials pass.
