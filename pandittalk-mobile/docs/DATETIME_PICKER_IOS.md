# iOS DateTimePicker confirm flow (#64)

## Problem

Date/time pickers used `display="default"` and closed on every `onChange`. That matches Android’s dialog, but on iOS spinning the wheel fires `onChange` continuously and dismissing can feel unpredictable.

## Fix

Shared `ConfirmableDateTimePicker`:

- **Android** — keep system dialog; commit on `set`, cancel on `dismissed`
- **iOS** — `display="spinner"` in a bottom sheet; draft value until **Done**; **Cancel** / backdrop dismiss leaves the previous value

Used by profile DOB/TOB, kundli, detailed kundli, and compatibility.

## Verify

- iOS: open date/time → spin → Cancel → value unchanged
- iOS: open → spin → Done → value updated
- Android: dialog still commits on OK and dismisses on cancel
