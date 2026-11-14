/** Free tools use Free. Paid tools use the coin amount once. */
export function toolHubChip(coins: number): string {
  if (!Number.isFinite(coins) || coins <= 0) return 'Free';
  return `${Math.round(coins)} coins`;
}
