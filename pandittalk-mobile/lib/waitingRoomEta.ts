/** Soft ETA copy for waiting rooms (policy no-show is 10 minutes). */
export const PANDIT_TYPICAL_JOIN_SECONDS = 3 * 60;
export const PANDIT_NO_SHOW_REFUND_SECONDS = 10 * 60;

export const LATE_PANDIT_COMPENSATION =
  'If the pandit has not joined within 10 minutes, the coins return to your wallet.';

/** What to do after a booking is confirmed, before the waiting room opens. */
export function confirmationJoinSteps(format: string): string[] {
  const arrive = 'Open the session from My Bookings a few minutes before the start.';
  const refund = LATE_PANDIT_COMPENSATION;
  if (format === 'audio') {
    return [arrive, 'Allow the microphone when the app asks.', refund];
  }
  if (format === 'video') {
    return [arrive, 'Allow the camera and microphone when the app asks.', refund];
  }
  return [arrive, 'Stay in the chat until the pandit replies.', refund];
}

export function formatElapsedMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function waitingRoomEtaLines(elapsedSeconds: number): {
  headline: string;
  detail: string;
} {
  const elapsed = Math.max(0, Math.floor(elapsedSeconds));
  const untilRefund = Math.max(0, PANDIT_NO_SHOW_REFUND_SECONDS - elapsed);

  if (elapsed < PANDIT_TYPICAL_JOIN_SECONDS) {
    return {
      headline: 'Waiting for pandit to join…',
      detail: `Usually joins within a few minutes · waited ${formatElapsedMmSs(elapsed)} · full refund if not joined in ${formatElapsedMmSs(untilRefund)}`,
    };
  }

  if (untilRefund > 0) {
    return {
      headline: 'Still waiting for the pandit…',
      detail: `Thanks for your patience · waited ${formatElapsedMmSs(elapsed)} · automatic full refund in ${formatElapsedMmSs(untilRefund)} if they don’t join`,
    };
  }

  return {
    headline: 'Pandit hasn’t joined yet',
    detail: `Waited ${formatElapsedMmSs(elapsed)} · you should receive a full refund shortly`,
  };
}
