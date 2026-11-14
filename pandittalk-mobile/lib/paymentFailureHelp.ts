export type PaymentFailureStage = 'order' | 'checkout' | 'verify';

export function paymentFailureTicket(input: {
  stage: PaymentFailureStage;
  packId: string;
  reason: string;
  paymentId?: string;
}): { category: 'payment_failed'; message: string } {
  const reason = input.reason.trim() || 'No details';
  const parts = [`Coin pack payment failed at ${input.stage}.`, `Pack ${input.packId}.`];
  const paymentId = input.paymentId?.trim();
  if (paymentId) parts.push(`Payment ${paymentId}.`);
  parts.push(`Reason: ${reason}`);
  return { category: 'payment_failed', message: parts.join(' ') };
}
