export function maxPackBonus(packs: { bonusCoins: number }[]): number {
  return packs.reduce((max, pack) => Math.max(max, Math.max(0, pack.bonusCoins || 0)), 0);
}

export function hasSuccessfulRecharge(
  transactions: { type: string; status: string | null }[],
): boolean {
  return transactions.some((tx) => {
    const type = tx.type.trim().toLowerCase();
    const status = (tx.status ?? '').trim().toLowerCase();
    return (type === 'purchase' || type === 'recharge') && status === 'success';
  });
}

/** Shown before the first successful coin purchase, when a pack includes bonus coins. */
export function welcomeBonusLine(hasRecharge: boolean, maxBonusLabel: string | null): string | null {
  if (hasRecharge || !maxBonusLabel) return null;
  return `Larger packs include bonus coins. The biggest bonus right now is ${maxBonusLabel} extra coins.`;
}
