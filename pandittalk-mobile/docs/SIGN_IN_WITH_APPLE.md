# Sign in with Apple — verification checklist (#315)

Guideline **4.8**: Google is offered on iOS, so Sign in with Apple must work end-to-end.

## Code (already wired)

| Layer | Location |
|-------|----------|
| Capability | `app.json` → `ios.usesAppleSignIn: true` + `expo-apple-authentication` plugin |
| UI | `SocialAuthButtons` — Apple button **iOS only**; beside Google |
| Client | `login.tsx` → `AppleAuthentication.signInAsync` → `postAppleAuth` |
| API | `POST` user-service `/auth/apple` (`AppleAuthDto.identityToken`) |
| Verify | `AppleTokenVerifier` audience = `APPLE_CLIENT_ID` (default `com.pandittalk.mobile`) |
| Account | Links `appleSub`; may return `pendingToken` → `/link-phone` |

## Apple Developer Console (ops)

1. App ID `com.pandittalk.mobile` → enable **Sign in with Apple**
2. Provisioning / EAS credentials rebuilt after enabling capability
3. Production `APPLE_CLIENT_ID` must match the **native App ID** used as token `aud` (default `com.pandittalk.mobile`). Do **not** point mobile native login at a Services ID meant for web only unless tokens are issued for that audience.
4. Confirm Team ID / bundle match App Store Connect

## Backend env

```bash
APPLE_CLIENT_ID=com.pandittalk.mobile
```

See `apps/backend/.env.example`.

## TestFlight / device matrix

- [ ] Fresh Apple ID: check Terms → Continue with Apple → allow → lands in app (or phone-link if required)
- [ ] Same user again: sign out → Apple → returns without re-collecting name/email
- [ ] **Hide My Email**: relay address accepted; profile/email not broken
- [ ] Cancel Apple sheet: no error toast (`ERR_REQUEST_CANCELED`)
- [ ] Google still visible on same screen (4.8 parity)

## App Review notes

Include the Sign in with Apple steps from `APP_STORE_REVIEW_NOTES.md` (paste into ASC).

## Out of scope / related

- Android: Apple button intentionally hidden (`#92`)
- Universal links (`#67`) are separate from Apple auth
