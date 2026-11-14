# Kundli loading cancel

Issue #154. Free Kundli and Detailed Kundli show Cancel on the generating screen. Header back also leaves that wait. Either path aborts the in-flight request and returns to the form without an error.

Detailed Kundli is charged only after the chart is generated and the HTTP request is still open. If the client has already gone, the server does not debit. If the client leaves in the moment after the debit, the charge is refunded and the report is not left as the response. A failed generation still refunds, and it no longer debits before the chart exists.

iOS still blocks the paid detailed chart before generation starts.
