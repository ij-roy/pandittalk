# Chat typing indicator

Typing is sent on the first keystroke, then again while the draft keeps changing, at most once every 2 seconds. It is not held until typing pauses.

The other person’s indicator stays up for 8 seconds after the latest typing event, so a pause in the event stream does not clear it immediately. A message from the pandit clears it at once.
