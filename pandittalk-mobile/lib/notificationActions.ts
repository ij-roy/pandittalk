export const SESSION_NOTIFICATION_CATEGORY = 'session-reminder';
export const JOIN_NOTIFICATION_ACTION = 'join';
export const RESCHEDULE_NOTIFICATION_ACTION = 'reschedule';

export type SessionNotificationAction = 'join' | 'reschedule' | 'open';

export function sessionNotificationAction(actionIdentifier: string | undefined): SessionNotificationAction {
  if (actionIdentifier === JOIN_NOTIFICATION_ACTION) return 'join';
  if (actionIdentifier === RESCHEDULE_NOTIFICATION_ACTION) return 'reschedule';
  return 'open';
}
