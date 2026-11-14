# Google Sign-In failure reasons (#264)

## Problem

Google connect / login failures often surfaced as generic “Something went wrong” when the SDK returned a coded error (missing Play Services, `DEVELOPER_ERROR`, network) that was not an `Error` instance.

## Fix

- `lib/googleAuth.ts`: `messageFromGoogleSignInError()` maps SDK status codes to clear next steps (Play Services update, OTP fallback, misconfigured client ID)
- `hasPlayServices` failures are caught and humanized
- Missing `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` fails early with an explicit message
- `formatApiConnectionError` / `messageFromAxiosError` also map common Google codes on plain objects

## Verify

- Android without Play Services / outdated: message mentions Play Services + OTP
- Cancel Google sheet: no error toast
- Profile → Connect Google failure shows the same humanized copy (not a raw code)
