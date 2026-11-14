# User-facing error reference

Issue #281: crashes showed a generic failure with nothing support could trace.

## What ships now

- The root Expo Router error boundary shows **Something went wrong** plus a short code (`PT-XXXXXX`)
- The same code is logged as `[error_reference=PT-XXXXXX]`
- The code is selectable so the user can copy it into a support message

Sentry or Crashlytics is not wired yet (no DSN in the app). When a crash reporter is added, tag events with `error_reference` using that log line.

Tracks #281.
