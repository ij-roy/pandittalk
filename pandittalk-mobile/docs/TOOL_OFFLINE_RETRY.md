# Tool submit errors when offline

Issue #163. A tool request that never reaches the server shows “No internet. Check your connection and try again.” instead of the raw Axios message. A canceled request is not treated as offline. A response from the server still shows that server message.

Kundli, detailed Kundli, and compatibility keep the form and show a Retry button under that message. Horoscope, monthly horoscope, tarot, and palm reading offer Retry on the alert, which runs the same request again.
