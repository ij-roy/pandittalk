# Universal Links / App Links (#67)

## Mobile (this monorepo)

`apps/mobile/app.json`:

- iOS `associatedDomains`: `applinks:www.pandittalk.com`, `applinks:pandittalk.com`
- Android `intentFilters` for `/experts`, `/articles`, `/app` on those hosts

Requires a new EAS/native build after merge (Associated Domains entitlement).

## Website (pandittalk-website)

Hosted files (separate PR):

- `https://www.pandittalk.com/.well-known/apple-app-site-association`
- `https://www.pandittalk.com/.well-known/assetlinks.json`

App ID: `K54M9H3JQG.com.pandittalk.mobile`

## Android SHA-256

Fill `sha256_cert_fingerprints` in `assetlinks.json` with the Play App Signing + upload key fingerprints before App Links autoVerify works.

```bash
eas credentials -p android
# or keytool -list -v -keystore ...
```

## Verify

1. Deploy website AASA → `curl -I https://www.pandittalk.com/.well-known/apple-app-site-association` → `Content-Type: application/json`
2. Install TestFlight build with Associated Domains
3. Notes → open `https://www.pandittalk.com/experts/<id>` → opens app
4. Uninstall app → same URL opens web
