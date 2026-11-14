export const INSUFFICIENT_COINS_TITLE = 'Not enough coins';
export const ADD_COINS_LABEL = 'Add coins';

export function insufficientCoinsBody(needed?: number, balance?: number): string {
  if (typeof needed === 'number' && typeof balance === 'number') {
    return `You need ${needed} coins. Your balance is ${balance}. Add coins to continue.`;
  }
  return 'You need more coins to continue. Add coins to your wallet.';
}
