# In-app WebView URL allowlist

## Why

Settings and login open Privacy / Terms / Help inside a WebView. Without a host
allowlist, a crafted navigation param (`/settings/webview?url=…`) could load an
arbitrary HTTPS page inside PanditTalk chrome (phishing risk). Tracked as
GitHub **#23**.

## Policy (iOS Option C friendly)

- Only **HTTPS** URLs load.
- Host must be on the allowlist: `www.pandittalk.com`, `pandittalk.com`, plus
  the host of `EXPO_PUBLIC_LEGAL_BASE` when set.
- Legal URLs come from `constants/legal.ts` (same base as production www).
- In-page navigations are re-checked via `onShouldStartLoadWithRequest`.

## Code

| Piece | Path |
| --- | --- |
| Allowlist helpers | `apps/mobile/lib/webviewAllowlist.ts` |
| Unit tests | `apps/mobile/lib/webviewAllowlist.test.ts` |
| Settings WebView | `apps/mobile/app/settings/webview.tsx` |
| Login legal WebView | `apps/mobile/app/legal-webview.tsx` |

## Verify

```powershell
cd apps/mobile
npm run test:webview-allowlist
```

Expect all tests to pass (rejects `example.com`, accepts www privacy/terms).

## Related

- Local refund / account-deletion copy (no remote URL): `app/settings/legal-doc.tsx`
- Public www pages for ASC metadata: issue **#312**
