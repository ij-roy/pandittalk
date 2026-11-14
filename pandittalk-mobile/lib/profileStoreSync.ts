/** Keep the profile the server returned. Request fields the server omitted are not kept. */
export function userAfterProfileSave(
  previous: Record<string, unknown> | null,
  server: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!server) return previous;
  const next: Record<string, unknown> = { ...server };
  const keptCoins = previous?.coinBalance;
  if (next.coinBalance == null && next.coin_balance == null && keptCoins != null) {
    next.coinBalance = keptCoins;
  }
  return next;
}
