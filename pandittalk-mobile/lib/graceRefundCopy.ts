export function graceRefundLabel(pending: boolean, secondsLabel: string): string {
  if (pending) return 'Processing refund…';
  return `Refund this session (${secondsLabel})`;
}
