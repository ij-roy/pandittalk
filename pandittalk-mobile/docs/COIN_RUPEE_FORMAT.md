# Coins and rupees

Issue #229: coin balances and rupee prices both went through `formatInr`, and a few prices used a raw number or `toLocaleString`.

- `formatCoins` is a grouped coin count with no rupee sign
- `formatRupee` is the same grouping with a `₹` prefix
- Wallet, history, reports, and refunds use `formatCoins`
- Booking prices and recharge pack prices use `formatRupee`

Tracks #229.
