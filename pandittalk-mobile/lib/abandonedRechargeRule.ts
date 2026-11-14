export const ABANDONED_RECHARGE_DELAY_MS = 30 * 60 * 1000;

export function shouldRemindAbandonedRecharge(input: {
  interested: boolean;
  paid: boolean;
}): boolean {
  return input.interested && !input.paid;
}
