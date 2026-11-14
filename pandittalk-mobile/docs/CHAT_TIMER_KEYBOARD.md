# Chat paid timer while keyboard open (#300)

## Problem

Paid remaining time lived only in the dark top header. With the keyboard open and attention on the composer, users often lost sight of how much paid time was left.

## Fix

When the keyboard is visible, show a sticky timer chip directly above the composer (`KeyboardStickyView`) labeled `Paid time · MM:SS` (or waiting elapsed). Turns red under the 5‑minute warning threshold.

## Verify

- Open chat, focus input → chip appears above the bar with the same countdown as the header
- Dismiss keyboard → chip hides; header timer remains
- Under 5 minutes remaining → chip uses warning red
