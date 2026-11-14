export type LedgerRowCopy = {
  title: string;
  detail: string | null;
};

const BOOKING_ID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function fullRefundDetail(description: string): string {
  const text = description.toLowerCase();
  if (text.includes('grace') || text.includes('trial')) {
    return 'Ended during the trial window. Coins are back in your wallet, not your bank.';
  }
  if (
    text.includes('timeout') ||
    text.includes('before') ||
    text.includes('cancel') ||
    text.includes('did not')
  ) {
    return 'The session did not go ahead. Coins are back in your wallet, not your bank.';
  }
  return 'The session charge is back in your wallet, not your bank.';
}

/** User-facing wallet row. Hides booking ids and separates unused-time returns from full refunds. */
export function ledgerRowCopy(tx: {
  type: string;
  description: string | null;
}): LedgerRowCopy {
  const type = tx.type.trim().toLowerCase();
  const description = (tx.description ?? '').replace(/\s+/g, ' ').trim();

  if (type === 'partial_refund' || /^partial refund\b/i.test(description)) {
    return {
      title: 'Unused time returned',
      detail:
        'Coins for time you did not use. They go back to your wallet, not your bank.',
    };
  }

  if (
    /refund for booking/i.test(description) ||
    /^session refund\b/i.test(description) ||
    /^full refund\b/i.test(description)
  ) {
    return { title: 'Full refund', detail: fullRefundDetail(description) };
  }

  if (type === 'refund') {
    const tool = description.replace(/^refund:\s*/i, '');
    return {
      title: tool && !BOOKING_ID.test(tool) ? `Refund · ${tool}` : 'Refund',
      detail: 'Returned to your wallet, not your bank.',
    };
  }

  if (type === 'booking_debit' && /session booking/i.test(description)) {
    return {
      title: description,
      detail: 'Taken from your wallet when the session was booked.',
    };
  }

  if (description && !BOOKING_ID.test(description)) {
    return { title: description, detail: null };
  }

  if (type === 'purchase' || type === 'recharge') {
    return { title: 'Coin purchase', detail: null };
  }
  if (type === 'booking_debit' || type === 'debit' || type === 'session_debit') {
    return { title: 'Session booking', detail: null };
  }
  if (type === 'bonus' || type === 'credit') {
    return { title: 'Wallet credit', detail: null };
  }
  return { title: type.replace(/_/g, ' ') || 'Wallet activity', detail: null };
}
