# Join-window promise

Issue #249 asks for a pandit response-time display before booking.

There is no measured reply-time field, so the profile does not invent one. The line that is shown is the rule the server already enforces: if the pandit has not joined within 10 minutes, the charge returns to the wallet (`DEFAULT_WAITING_TIMEOUT_MS` = 600000).

It appears on the expert profile footer, on the chat-now sheet, and on the last step of booking audio or video.

Tracks #249.
