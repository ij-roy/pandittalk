export type ConfirmationAction = 'join' | 'bookings';

export function confirmationShowsJoin(
  format: string,
  status: string,
  canJoinCall: boolean,
): boolean {
  if (format === 'chat') return true;
  return (format === 'audio' || format === 'video') && status === 'confirmed' && canJoinCall;
}

export function confirmationActionOrder(showsJoin: boolean): ConfirmationAction[] {
  if (showsJoin) return ['join', 'bookings'];
  return ['bookings'];
}
