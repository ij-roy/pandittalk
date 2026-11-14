# Connection errors

Issue #206. When the app cannot reach the API, the message no longer includes the server address, port 3001, or Wi-Fi setup instructions.

A public API host says to check the connection. A local, emulator, or private-network address says this build's server address needs to be updated, without printing that address. A message returned by the server is still shown as sent.

Login, OTP, phone linking, chat start, and audio or video session start use this copy.
