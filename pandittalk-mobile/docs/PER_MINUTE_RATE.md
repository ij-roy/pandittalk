# Per-minute effective rate (#299)

## Problem

Depth/format cards showed package totals only, so comparing Entry / Standard / Deep (or Audio vs Video) for value was hard.

## Fix

- `formatPerMinuteRate(total, minutes)` → `≈ ₹X/min`
- Expert booking sheet: depth cards, format rows, and total summary
- Guidance flow depth cards

## Verify

- Entry 151/15 ≈ ₹10/min; Standard 301/25 ≈ ₹12/min; Deep 501/45 ≈ ₹11/min
- Video (+150) raises the shown per-minute rate for the selected depth
