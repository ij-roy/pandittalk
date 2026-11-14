# Auth hydration

The splash stays up until a saved session is read. An expired access token is refreshed before the app is shown, so a signed-in person is not sent to login and then back. Login is only opened after that read, and only when there is no token and the person is not a guest.
