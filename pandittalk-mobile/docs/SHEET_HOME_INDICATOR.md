# Sheet home-indicator safe area (#63)

Shared bottom action sheets previously used a fixed `paddingBottom: 24` and sat under the iOS home indicator on notched devices.

## Fix

- `useSheetBottomPadding()` returns `24 + safe-area bottom inset`
- Applied in `BottomSheet`, avatar picker, marital-status sheet, and city picker
- `formStyles.sheet` base `paddingBottom` is `0`; consumers apply the hook

## Verify

On a notched iPhone (simulator or device): open profile photo sheet, marital status, and city picker — last row / Cancel should clear the home indicator and remain tappable.
