export type LedgerRefundWrite = {
  type: 'refund' | 'partial_refund';
  description: string;
};

/** Plain ledger copy. Callers pass internal reasons; users never see booking ids. */
export function ledgerRefundWrite(
  kind: 'full' | 'partial',
  reason: string,
): LedgerRefundWrite {
  if (kind === 'partial') {
    return {
      type: 'partial_refund',
      description: 'Unused session time returned to your wallet',
    };
  }

  const text = reason.toLowerCase();
  if (text.includes('grace') || text.includes('trial')) {
    return {
      type: 'refund',
      description: 'Full refund — ended during the trial window',
    };
  }
  if (
    text.includes('timeout') ||
    text.includes('before') ||
    text.includes('cancel') ||
    text.includes('did not')
  ) {
    return {
      type: 'refund',
      description: 'Full refund — session did not go ahead',
    };
  }
  return {
    type: 'refund',
    description: 'Full refund returned to your wallet',
  };
}
