# Mobile Home First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the authenticated mobile home consultation-first and category-honest, point it at the public API, build the release APK, and pause for mobile UI/UX approval before any website work.

**Architecture:** Keep the existing mobile home layout and sections. Replace its home-only search behavior with a live expert preview loaded through the existing `expertsApi`, route topic tiles using the existing Experts-tab filter IDs, and make the backend allowlist/mapping the single source of truth for those IDs. Do not modify website files in this phase.

**Tech Stack:** Expo Router, React Native, TypeScript, Axios, NestJS, Prisma seed metadata, Jest, Gradle.

---

### Task 1: Lock the mobile topic and preview contract with failing tests

**Files:**
- Create: `pandittalk-mobile/scripts/verify-home-first.cjs`
- Create: `pandittalk-backend/apps/user-service/src/experts/expert-area-filter.spec.ts`

- [ ] **Step 1: Write the failing mobile source contract**

  Make `verify-home-first.cjs` read `app/(tabs)/index.tsx` and fail unless the source contains:

  - the six exact visible labels: `Career &\\nBusiness`, `Love &\\nRelationships`, `Finance &\\nWealth`, `Marriage &\\nFamily`, `Health &\\nWellbeing`, and `Spiritual\\nProtection`;
  - `fetchExperts` and a featured-expert selection/render path;
  - an expert-directory route using `/experts`;
  - no `SearchBar`, `Search consultation topics and experts`, `Legal Advice`, or `Life Path` strings.

  Run:

  ```powershell
  node scripts/verify-home-first.cjs
  ```

  Expected: FAIL because the current home still contains the search and removed topic labels and has no featured expert preview.

- [ ] **Step 2: Write backend mapping tests**

  Add tests for `resolveGuidanceAreasForFilter` and `buildAreaWhere` that assert:

  ```ts
  expect(resolveGuidanceAreasForFilter('career_business')).toEqual(['career', 'business']);
  expect(resolveGuidanceAreasForFilter('spiritual_protection')).toEqual(['spiritual_protection']);
  expect(resolveGuidanceAreasForFilter('legal_advice')).toBeNull();
  expect(resolveGuidanceAreasForFilter('life_path')).toBeNull();
  expect(buildAreaWhere(['spiritual_protection'])).toEqual({ guidanceAreas: { has: 'spiritual_protection' } });
  ```

  Run:

  ```powershell
  npm test -- --runInBand apps/user-service/src/experts/expert-area-filter.spec.ts
  ```

  Expected: FAIL because the current DTO and mapping still accept the removed IDs and do not map spiritual protection.

- [ ] **Step 3: Commit the red tests**

  ```powershell
  git add pandittalk-mobile/scripts/verify-home-first.cjs pandittalk-backend/apps/user-service/src/experts/expert-area-filter.spec.ts
  git commit -m "test: define mobile home category contract"
  ```

### Task 2: Implement the backend category contract

**Files:**
- Modify: `pandittalk-backend/apps/user-service/src/experts/dto/list-experts-query.dto.ts`
- Modify: `pandittalk-backend/apps/user-service/src/experts/expert-area-filter.ts`
- Modify: `pandittalk-backend/apps/user-service/prisma/pandit-seed.ts`
- Modify: `pandittalk-mobile/lib/bookingPricing.ts`
- Modify: `pandittalk-mobile/lib/guidancePreferences.ts`
- Modify: `pandittalk-mobile/app/guidance/flow.tsx`
- Modify: `pandittalk-mobile/app/(tabs)/experts.tsx`

- [ ] **Step 1: Define only the supported expert filter IDs**

  Keep `career_business`, `love_relationships`, `finance_wealth`, `marriage_family`, `health_wellbeing`, and `spiritual_protection` in `EXPERT_AREA_IDS`. Remove `legal_advice` and `life_path` from that list and from the mobile Experts-tab filter union, labels, dropdown order, regex map, and quick-filter generation.

- [ ] **Step 2: Add the spiritual protection persistence key**

  Add `spiritual_protection` to the backend `BookingAreaId` allowlist and seed `GuidanceAreaKey`. Map `spiritual_protection` to `['spiritual_protection']` in `EXPERT_AREA_TO_GUIDANCE`. Add the same key to the mobile booking-area list and guidance-preference allowlist so the guidance flow can accept it without silently coercing it.

- [ ] **Step 3: Remove legacy seed labels**

  Update code-defined `Life Path` seed metadata to supported category labels that match their actual areas. Do not create a fake Pandita Meera or fake rating/review record. Existing seed rows must never advertise a category removed from the API contract.

- [ ] **Step 4: Run the red tests until green**

  ```powershell
  npm test -- --runInBand apps/user-service/src/experts/expert-area-filter.spec.ts
  node scripts/verify-home-first.cjs
  ```

  Expected: backend mapping tests pass; the mobile contract remains red until Task 3.

- [ ] **Step 5: Commit the backend category contract**

  ```powershell
  git add pandittalk-backend pandittalk-mobile/lib/bookingPricing.ts pandittalk-mobile/lib/guidancePreferences.ts pandittalk-mobile/app/guidance/flow.tsx 'pandittalk-mobile/app/(tabs)/experts.tsx'
  git commit -m "feat: make expert topic categories explicit"
  ```

### Task 3: Implement the mobile home preview and remove home search

**Files:**
- Create: `pandittalk-mobile/lib/homeFeaturedPandit.ts`
- Create: `pandittalk-mobile/lib/homeFeaturedPandit.test.ts`
- Modify: `pandittalk-mobile/app/(tabs)/index.tsx`
- Modify: `pandittalk-mobile/scripts/verify-home-first.cjs`

- [ ] **Step 1: Add selection tests for real expert data**

  Test that `selectFeaturedPandit`:

  - prefers an online verified expert;
  - otherwise prefers an online expert;
  - otherwise returns the first bookable expert;
  - returns `null` for an empty list;
  - never fabricates a name, rating, language, or price.

  Run:

  ```powershell
  node --experimental-strip-types --test lib/homeFeaturedPandit.test.ts
  ```

  Expected: FAIL because the helper does not exist.

- [ ] **Step 2: Implement the minimal selection helper**

  Use `ExpertEntity` fields only. Sort by online status, verified status, rating, and review count without changing the values. Keep the helper pure so it can be tested without React Native.

- [ ] **Step 3: Add the non-blocking live preview to the home**

  In `index.tsx`:

  - import `fetchExperts` and the selection helper;
  - load experts in a separate effect from article loading;
  - keep home usable if the request fails;
  - render a compact card below `primaryActions` and before profile progress;
  - use `Available now` only when `expert.isOnline` is true;
  - otherwise use an honest booking state such as `Available to book`;
  - display `expert.name`, `expert.languagesDisplay`, live rating/review text when available, and the API’s session price with the existing app’s pricing wording;
  - route the card to `/experts/{id}`.

- [ ] **Step 4: Remove only the home search behavior**

  Remove `SearchBar`, debounce/search-result state, search measurement refs, floating result panel, and search-only callbacks from `index.tsx`. Keep article fetching for Helpful reading and Latest.

- [ ] **Step 5: Replace home topic data with the six real filters**

  Give each tile an `expertArea` from the supported contract and route with:

  ```ts
  router.push({ pathname: '/experts', params: { area: item.expertArea } });
  ```

  Do not route a visible topic through a different area key.

- [ ] **Step 6: Run mobile contract and helper tests**

  ```powershell
  node scripts/verify-home-first.cjs
  npm run typecheck
  npm run lint -- --no-cache
  ```

  Expected: the home contract passes; TypeScript has no errors; lint may report existing warnings but no new errors.

- [ ] **Step 7: Commit the mobile home implementation**

  ```powershell
  git add 'pandittalk-mobile/app/(tabs)/index.tsx' pandittalk-mobile/lib/homeFeaturedPandit.ts pandittalk-mobile/lib/homeFeaturedPandit.test.ts pandittalk-mobile/scripts/verify-home-first.cjs
  git commit -m "feat: improve mobile consultation home"
  ```

### Task 4: Point the mobile app at the public backend

**Files:**
- Modify: `pandittalk-mobile/.env`
- Modify: `pandittalk-mobile/.env.example` only if its documented stable API value is also intentionally updated

- [ ] **Step 1: Set the active mobile API override**

  Set the active `.env` value to:

  ```dotenv
  EXPO_PUBLIC_API_BASE=https://api-pandittalk.dophera.tech/
  ```

  Keep the runtime’s trailing-slash normalization behavior and do not change secrets.

- [ ] **Step 2: Verify the resolved API origin**

  Run:

  ```powershell
  Select-String -Path .env -Pattern '^EXPO_PUBLIC_API_BASE='
  npm run typecheck
  ```

  Expected: the first command prints `https://api-pandittalk.dophera.tech/`, and TypeScript passes. The release bundle must not use the old Worker hostname.

- [ ] **Step 3: Keep the local mobile API configuration out of git**

  `.env` is intentionally ignored because it contains local client configuration. Do not force-add it or commit secrets. The build uses the verified local value.

### Task 5: Build and verify the release APK, then pause

**Files:**
- Artifact: `pandittalk-mobile/android/app/build/outputs/apk/release/app-release.apk`

- [ ] **Step 1: Build the Android release**

  ```powershell
  .\\gradlew.bat assembleRelease
  ```

  Run from `pandittalk-mobile/android` and capture the exit code and generated APK path.

- [ ] **Step 2: Verify the artifact**

  Confirm the APK exists, has a non-zero size, and inspect the release bundle/configuration for `api-pandittalk.dophera.tech` rather than the old Worker hostname.

- [ ] **Step 3: Run final phase-one checks**

  ```powershell
  node scripts/verify-home-first.cjs
  npm run typecheck
  npm run lint -- --no-cache
  git diff --check
  ```

- [ ] **Step 4: Append the implementation decision**

  Append a dated entry to `Decisions.md` explaining that mobile is the approved UX reference, search was removed from the home, unsupported categories were removed, and the preview is API-backed rather than hardcoded.

- [ ] **Step 5: Pause the goal**

  Report the APK path and verification evidence, then call `update_goal` with status `paused` because the user explicitly requested waiting for mobile UI/UX approval before website implementation.
