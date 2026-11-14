export function notificationPrefExample(type: string): string {
  switch (type) {
    case 'booking_confirmed':
      return 'Example: Your chat with Pandit Ravi is booked for 6:00 PM.';
    case 'session_reminder_30':
      return 'Example: Your session starts in 30 minutes.';
    case 'session_reminder_10':
      return 'Example: Your session starts in 10 minutes.';
    case 'session_reminder_5':
      return 'Example: Your session starts in 5 minutes.';
    case 'session_started':
      return 'Example: Pandit Ravi has joined. You can enter now.';
    case 'session_ended':
      return 'Example: Your session with Pandit Ravi has ended.';
    case 'new_message':
      return 'Example: Pandit Ravi sent you a message.';
    case 'chat_now_accepted':
      return 'Example: Pandit Ravi accepted your chat and is ready.';
    case 'chat_now_missed':
      return 'Example: A pandit could not take your chat request.';
    default:
      return 'Example: An update about your session.';
  }
}
