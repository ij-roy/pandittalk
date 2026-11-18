# Mobile Home First Design

## Goal

Improve the authenticated mobile home as the approved product reference before changing the website. The first screen should make real Pandit consultations obvious, provide an honest real-data Pandit preview, and expose only topic filters that map to real backend categories.

## Scope

This phase changes the mobile app and the backend category contract only. The website is deliberately deferred until the user reviews and approves the mobile build.

In scope:

- Add a compact real-data Pandit preview below the primary consultation actions.
- Remove the home-screen article/expert search field and its floating-results behavior.
- Remove `Legal Advice` and `Life Path` from the home topic grid.
- Keep these six visible topic filters:
  - Career & Business
  - Love & Relationships
  - Finance & Wealth
  - Marriage & Family
  - Health & Wellbeing
  - Spiritual Protection
- Make each topic route to the same expert-filter identifier used by the Experts tab and backend API.
- Add `spiritual_protection` as a real backend guidance area and map it to persisted Pandit guidance areas.
- Remove unsupported `legal_advice` and `life_path` expert-filter identifiers from the supported mobile/backend filter contract.
- Point the mobile app at `https://api-pandittalk.dophera.tech/`.
- Build the Android release APK with `gradlew assembleRelease`.

Out of scope:

- Website UI changes. Those wait for mobile approval.
- Changing the tools section or adding a label that diminishes its value. The existing `Optional self-service tools` heading remains unchanged.
- Inventing Pandit names, ratings, online status, reviews, or prices in the client.

## Product design

The current mobile information order remains intact because its sections have clear separation:

1. Consultation hero.
2. `Chat Now` and `Book chat, audio or video` actions.
3. Real-data Pandit preview.
4. Profile progress when incomplete.
5. Topic grid.
6. Helpful reading.
7. Self-service tools.

The search field is removed from the home screen because it adds another decision at the top of the page and its current implementation searches articles despite promising consultation topics and experts.

The real-data Pandit preview loads `fetchExperts()` and selects the first online expert, preferring verified experts and higher live rating when available. It displays the API’s name, languages, rating/review state, and price-per-session value. If no online expert exists, it shows the first bookable expert with an honest offline/booking state instead of claiming “Available now.” The card opens the expert profile and offers the same expert directory path as the existing primary actions.

## Category contract

The mobile home will use the following expert filter IDs directly:

| Visible label | Expert filter ID | Persisted guidance areas |
|---|---|---|
| Career & Business | `career_business` | `career`, `business` |
| Love & Relationships | `love_relationships` | `love` |
| Finance & Wealth | `finance_wealth` | `finance` |
| Marriage & Family | `marriage_family` | `family`, `marriage` |
| Health & Wellbeing | `health_wellbeing` | `health` |
| Spiritual Protection | `spiritual_protection` | `spiritual_protection` |

`legal_advice` and `life_path` are removed from the supported expert filter list. No visible topic points to a different identifier or silently falls back to another category.

## API and error behavior

- The preview uses the existing public experts endpoint and normalizer.
- Loading the preview must not block the rest of the home screen.
- If expert loading fails or returns no rows, the home remains usable and the preview is omitted or shows a neutral retry-safe state; no fake data is inserted.
- Existing article loading remains for the Helpful reading and Latest sections; only the home search request/state is removed.

## Verification

- Add a source-level mobile home contract test for the six exact topic labels, the absence of search/legal/life-path strings, the real-data preview call, and the expert-directory routing.
- Add backend unit coverage for the supported filter IDs and their guidance-area mappings, including `spiritual_protection` and the rejection of removed identifiers by the DTO contract.
- Run mobile TypeScript and lint checks.
- Run backend unit tests for the expert filter.
- Run `android\\gradlew.bat assembleRelease` from `pandittalk-mobile` and report the generated APK path.
- Pause the active goal after the APK is built, waiting for the user’s mobile UI/UX approval before beginning website parity.
