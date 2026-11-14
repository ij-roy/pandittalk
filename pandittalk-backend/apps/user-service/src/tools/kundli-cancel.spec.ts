import { KUNDLI_CANCELLED_MESSAGE, requestClientLeft } from './kundli-cancel';

describe('requestClientLeft', () => {
  it('treats a destroyed or aborted request as gone', () => {
    expect(requestClientLeft({})).toBe(false);
    expect(requestClientLeft({ destroyed: true })).toBe(true);
    expect(requestClientLeft({ aborted: true })).toBe(true);
  });

  it('tells the customer they were not charged', () => {
    expect(KUNDLI_CANCELLED_MESSAGE).toContain('not charged');
  });
});
