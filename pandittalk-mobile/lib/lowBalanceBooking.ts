import { formatCoins } from './bookingPricing';

export function coinsShortfall(needed: number, balance: number): number {
  const need = Number.isFinite(needed) ? Math.max(0, Math.round(needed)) : 0;
  const have = Number.isFinite(balance) ? Math.max(0, Math.round(balance)) : 0;
  return Math.max(0, need - have);
}

/** Smallest pack that covers the shortfall. */
export function suggestCoinPack<T extends { coins: number }>(packs: T[], shortfall: number): T | null {
  if (shortfall <= 0) return null;
  const usable = packs
    .filter((pack) => Number.isFinite(pack.coins) && pack.coins > 0)
    .sort((a, b) => a.coins - b.coins);
  return usable.find((pack) => pack.coins >= shortfall) ?? null;
}

export function lowBalanceBookingCopy(
  needed: number,
  balance: number,
  packCoins?: number | null,
): string {
  const short = coinsShortfall(needed, balance);
  const base = `This session is ${formatCoins(needed)} coins. You have ${formatCoins(balance)}. You are short ${formatCoins(short)}.`;
  if (packCoins && packCoins > 0 && packCoins >= short) {
    return `${base} A ${formatCoins(packCoins)} coin pack covers it. Your selected time stays here.`;
  }
  return `${base} Add coins to continue. Your selected time stays here.`;
}

export function isInsufficientCoinsMessage(message: string): boolean {
  return /insufficient|not enough coins|low balance/i.test(message);
}
