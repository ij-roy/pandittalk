import {
  getMaxDateForMinimumAge,
  isAtLeastAge,
  MINIMUM_ACCOUNT_AGE,
  parseDobDate,
} from './age';

describe('age helpers', () => {
  it('parses YYYY-MM-DD and rejects invalid calendar dates', () => {
    expect(parseDobDate('2000-02-29')?.getDate()).toBe(29);
    expect(parseDobDate('2001-02-29')).toBeNull();
    expect(parseDobDate('1995-08-21T12:00:00.000Z')?.getFullYear()).toBe(1995);
  });

  it('computes age relative to asOf (birthday boundary)', () => {
    const asOf = new Date(2026, 8, 30); // 30 Sep 2026
    expect(isAtLeastAge('2008-09-30', MINIMUM_ACCOUNT_AGE, asOf)).toBe(true);
    expect(isAtLeastAge('2008-10-01', MINIMUM_ACCOUNT_AGE, asOf)).toBe(false);
    expect(isAtLeastAge('2010-01-01', MINIMUM_ACCOUNT_AGE, asOf)).toBe(false);
  });

  it('returns max adult DOB as today minus 18 years', () => {
    const asOf = new Date(2026, 8, 30);
    const max = getMaxDateForMinimumAge(MINIMUM_ACCOUNT_AGE, asOf);
    expect(max.getFullYear()).toBe(2008);
    expect(max.getMonth()).toBe(8);
    expect(max.getDate()).toBe(30);
  });
});
