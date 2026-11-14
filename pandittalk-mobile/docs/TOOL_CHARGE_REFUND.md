# Tool charge vs result failure (#261)

## Problem

Paid detailed tools debit coins before GPT generation / report save. If generation fails after debit, users can see a stale wallet balance and unclear errors (especially Detailed Kundli / monthly unlock).

## Fix

**Backend**
- Detailed Kundli / Compatibility already `refundToolCharge` on generation failure
- Monthly horoscope unlock now refunds if `saveMonthlyHoroscopeReport` fails after debit

**Mobile**
- `postDetailedKundli` / `postDetailedCompatibility` / `unlockTool` refresh wallet from profile on error (so refunds appear immediately)
- Kundli detailed + monthly unlock show explicit “coins refunded if charged” messaging (parity with compatibility)

## Verify

- Force a detailed kundli API failure after debit → wallet restored; alert mentions refund
- Monthly unlock with save failure → refund transaction + restored balance
- Success path still updates `newBalance` as before
