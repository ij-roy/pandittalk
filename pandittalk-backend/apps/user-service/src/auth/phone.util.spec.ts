import { normalizeIndiaPhone } from './phone.util';

describe('normalizeIndiaPhone', () => {
  it('accepts canonical E.164', () => {
    expect(normalizeIndiaPhone('+919876543210')).toBe('+919876543210');
  });

  it('normalizes 10-digit and 91-prefixed forms', () => {
    expect(normalizeIndiaPhone('9876543210')).toBe('+919876543210');
    expect(normalizeIndiaPhone('919876543210')).toBe('+919876543210');
    expect(normalizeIndiaPhone('09876543210')).toBe('+919876543210');
    expect(normalizeIndiaPhone('+91 98765 43210')).toBe('+919876543210');
  });

  it('rejects garbage and landline-like numbers', () => {
    expect(normalizeIndiaPhone('hello')).toBeNull();
    expect(normalizeIndiaPhone('1234567890')).toBeNull();
    expect(normalizeIndiaPhone('+911234567890')).toBeNull();
    expect(normalizeIndiaPhone('')).toBeNull();
  });
});
