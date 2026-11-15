import { ledgerRefundWrite } from './ledger-copy';

describe('ledgerRefundWrite', () => {
  it('labels unused time separately from a full refund', () => {
    expect(
      ledgerRefundWrite('partial', 'Partial refund — pandit disconnected'),
    ).toEqual({
      type: 'partial_refund',
      description: 'Unused session time returned to your wallet',
    });
  });

  it('does not put a booking id in a full refund line', () => {
    const row = ledgerRefundWrite('full', 'Session refund — pandit timeout');
    expect(row.type).toBe('refund');
    expect(row.description).toBe('Full refund — session did not go ahead');
    expect(row.description).not.toMatch(/[0-9a-f]{8}-/i);
  });

  it('calls out the trial window', () => {
    expect(
      ledgerRefundWrite('full', 'Session refund — user grace period')
        .description,
    ).toBe('Full refund — ended during the trial window');
  });
});
