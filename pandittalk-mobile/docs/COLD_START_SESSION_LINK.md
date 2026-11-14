# Opening a session from a notification

A tap opens that booking once. The same tap is not opened again when the app finishes restoring sign-in, or the next time the app is opened from the icon.

The app waits until sign-in is restored before it chooses the session or the login screen. The booking id is read from the notification, including when it is nested inside the push data.
