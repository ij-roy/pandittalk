# Wallet transaction list

The wallet keeps a row when the API uses another name for the id, the coin amount, or the date. A nested transaction object is read the same way. A decimal amount is read as a number.

A missing date stays blank instead of being replaced with the current time. A row with no readable coin amount stays in the list as amount unavailable. The app does not print the raw wallet payload.
