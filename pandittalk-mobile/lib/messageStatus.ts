export function ownMessageStatus(pending: boolean): 'Sending' | 'Sent' {
  return pending ? 'Sending' : 'Sent';
}
