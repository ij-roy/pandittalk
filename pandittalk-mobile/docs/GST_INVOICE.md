# GST invoice for recharges

Issue #257. A successful coin recharge (`type` `purchase`, `status` `SUCCESS`) can be downloaded as a tax invoice from the wallet history.

The price stored on the transaction is GST-inclusive. The invoice splits it at 18% so taxable value plus GST equals the amount paid. It does not invent a CGST/SGST or IGST split, because the payment does not store a place of supply.

## API

`GET /wallet/transactions/:id/invoice` requires the signed-in owner. Pending, failed, and non-recharge rows are rejected.

Seller lines come from `GST_LEGAL_NAME`, `GST_ADDRESS`, and `GSTIN`. When `GSTIN` is unset, the invoice omits that line rather than printing a placeholder number. Set those three values before production invoices go to customers.

## App

Wallet → Transaction History shows **Tax invoice** on a paid recharge. The button shares the invoice text so the customer can save or send it. Coin purchases fund live consultations, so this download stays available on iOS.
