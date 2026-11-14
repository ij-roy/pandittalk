# Public refund & account-deletion URLs (App Store / Play)

## Problem

GitHub **#312**: mobile `legal.ts` and ASC expect stable www URLs, but live
`https://www.pandittalk.com/refund-policy` and `/account-deletion` returned **404**.

The marketing site (`pandittalk/pandittalk-website`) already shipped full pages at:

| Canonical path | Purpose |
| --- | --- |
| `/refund-and-cancellation-policy` | Refund & cancellation |
| `/delete-account` | Account deletion |

## Fix

1. **Website redirects** (`pandittalk-website` `next.config.ts`):
   - `/refund-policy` → `/refund-and-cancellation-policy` (308/301)
   - `/account-deletion` → `/delete-account` (308/301)
2. **Mobile canonical URLs** (`apps/mobile/constants/legal.ts`):
   - `getRefundPolicyUrl()` → `…/refund-and-cancellation-policy`
   - `getAccountDeletionUrl()` → `…/delete-account`
3. In-app Settings still shows local copies via `settings/legal-doc` for offline UX;
   remote URLs above are for WebView / ASC / Play metadata.

## Verify (after website deploy)

```powershell
# Expect 200 (or 301/308 then 200)
Invoke-WebRequest https://www.pandittalk.com/refund-policy -Method Head
Invoke-WebRequest https://www.pandittalk.com/account-deletion -Method Head
Invoke-WebRequest https://www.pandittalk.com/refund-and-cancellation-policy -Method Head
Invoke-WebRequest https://www.pandittalk.com/delete-account -Method Head
```

## Related

- WebView allowlist: `apps/mobile/docs/WEBVIEW_ALLOWLIST.md` (#23)
- Review notes: `apps/mobile/docs/APP_STORE_REVIEW_NOTES.md`
