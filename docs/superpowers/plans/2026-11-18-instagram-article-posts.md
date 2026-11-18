# Instagram-Style Article Posts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the mobile home feed so self-service tools are followed by a clear gap and Latest article posts styled like calm Instagram posts.

**Architecture:** Keep the existing API and `ArticleCard` variants. Move the home `Latest` heading below the tools block, and isolate the new animated author/metadata treatment inside the `feed` article variant so compact, tile, and featured cards remain unchanged.

**Tech Stack:** Expo React Native, TypeScript, `expo-image`, React Native `Animated`, existing PanditTalk design tokens.

---

### Task 1: Add the failing home-feed regression contract

**Files:**
- Create: `pandittalk-mobile/scripts/verify-article-feed-layout.cjs`

- [ ] **Step 1: Assert the approved labels, order, spacing, and post metadata contract**

The verifier will read the two affected source files and fail until the implementation contains:

```js
assertOrder(homeSource, 'Self-service tools', 'Latest');
assertIncludes(homeSource, 'marginTop: 32');
assertIncludes(articleSource, 'Curated guidance for everyday questions');
assertIncludes(articleSource, 'min read');
assertIncludes(articleSource, 'articleCategoryLabel(article.category)');
assertIncludes(articleSource, 'Animated');
assertIncludes(articleSource, 'authorAvatar');
assertNotIncludes(homeSource, 'Optional self-service tools');
```

- [ ] **Step 2: Run the verifier and confirm it fails for the missing implementation**

Run from `pandittalk-mobile`:

```powershell
node scripts/verify-article-feed-layout.cjs
```

Expected result: FAIL because the current home screen still contains `Optional self-service tools` and renders `Latest` before the tools.

### Task 2: Implement the approved home layout and social-style feed post

**Files:**
- Modify: `pandittalk-mobile/app/(tabs)/index.tsx`
- Modify: `pandittalk-mobile/components/ArticleCard.tsx`

- [ ] **Step 1: Move Latest below the tools block**

Change the home header to render:

```tsx
<SectionHeader title="Self-service tools" />
<Text style={styles.toolsIntro}>...</Text>
<View style={styles.toolsRow}>...</View>
{feedArticles.length > 0 ? <SectionHeader title="Latest" style={styles.latestSection} /> : null}
```

Remove the old `latestLabel` before the tools. Set `latestSection.marginTop` to `32` so the tools and article feed do not touch.

- [ ] **Step 2: Add an Instagram-style identity row to feed posts**

Create a dedicated feed-post component inside `ArticleCard.tsx`. It will show the PanditTalk app icon, the resolved author name, and one contextual subtitle above the image:

```tsx
const displayName = isPanditTalkTeam ? 'PanditTalk Team' : article.author;
const subtitle = isPanditTalkTeam
  ? 'Curated guidance for everyday questions'
  : 'Guidance from the PanditTalk community';
```

The identity row uses a small circular logo/avatar and a quiet overflow icon. The source article API and existing card variants remain unchanged.

- [ ] **Step 3: Make feed images square and flush with the post**

Remove the feed image corner clipping and avoid a separate rounded image treatment. Keep the article post readable through spacing and a subtle divider/shadow instead of rounding the image.

- [ ] **Step 4: Add one slow, quiet metadata position on the image**

Use a React Native `Animated.Value` for opacity. Start with `${article.readTimeMinutes} min read`, hold it for 7 seconds, crossfade to the category, hold it for 7 seconds, and repeat. Use a 1.2-second fade, a bottom image gradient, and no pill, pulse, or scale animation.

The metadata remains in the same bottom-right position and only one value is rendered at a time.

### Task 3: Verify and package

**Files:**
- No additional production files.

- [ ] **Step 1: Run the regression verifier and TypeScript checks**

```powershell
node scripts/verify-article-feed-layout.cjs
npm run typecheck
npm run lint
```

- [ ] **Step 2: Build the release APK**

From `pandittalk-mobile/android`:

```powershell
$env:NODE_OPTIONS='--max-old-space-size=2048'; .\gradlew.bat --no-daemon --max-workers=1 assembleRelease
```

- [ ] **Step 3: Verify the APK exists and record its checksum**

```powershell
$apk = 'app/build/outputs/apk/release/app-release.apk'
Get-Item $apk | Select-Object FullName,Length,LastWriteTime
Get-FileHash $apk -Algorithm SHA256
```
