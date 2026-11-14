# Offline chat queue

Issue #254: a message typed while the chat socket was down was dropped.

`sendMessage` keeps that text until the session join succeeds, then sends it. The chat shows the line immediately with “Waiting to send”, and replaces it when the server echo arrives. A later history load keeps any line that is still waiting.

Tracks #254.
