# City search keyboard avoidance — GitHub #60

## Problem

`SearchableCityPicker` used `KeyboardAvoidingContainer`, which was a no-op `<View>`,
so the iOS keyboard covered the bottom-sheet search field.

## Fix

- Pad the sheet with `useKeyboardBottomInset()` (`marginBottom` = keyboard height)
- Shrink result list max height while the keyboard is open
- Make `KeyboardAvoidingContainer` a real `KeyboardAvoidingView` from
  `react-native-keyboard-controller` for other callers

## Verify

- Profile / kundli / compatibility → open city picker → focus search on iPhone
- Input and results stay above the keyboard
