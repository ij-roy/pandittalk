export function sessionRemindersBlocked(input: {
  granted: boolean;
  provisional: boolean;
}): boolean {
  return !input.granted && !input.provisional;
}

export function notificationPermissionCopy(os: string): {
  title: string;
  body: string;
  action: string;
} {
  const where =
    os === 'ios'
      ? 'Settings, Notifications, PanditTalk'
      : 'Settings, Apps, PanditTalk, Notifications';
  return {
    title: 'Session reminders are off',
    body: `This list still shows updates inside the app. To be reminded before a session, allow notifications in ${where}.`,
    action: 'Open settings',
  };
}
