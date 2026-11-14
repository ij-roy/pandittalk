import {
  getMaxDateForMinimumAge,
  isAdultAccountUser,
  isAtLeastAge,
  MINIMUM_ACCOUNT_AGE,
  parseDobDate,
} from './age';

describe('age helpers (mobile)', () => {
  it('parses YYYY-MM-DD', () => {
    expect(parseDobDate('1995-08-21')?.getFullYear()).toBe(1995);
    expect(parseDobDate('not-a-date')).toBeNull();
  });

  it('enforces 18+ on birthday boundary', () => {
    const asOf = new Date(2026, 8, 30);
    expect(isAtLeastAge('2008-09-30', MINIMUM_ACCOUNT_AGE, asOf)).toBe(true);
    expect(isAtLeastAge('2008-10-01', MINIMUM_ACCOUNT_AGE, asOf)).toBe(false);
  });

  it('detects adult account from user payload', () => {
    expect(isAdultAccountUser({ dob: '2000-01-01' })).toBe(true);
    expect(isAdultAccountUser({ dob: '2020-01-01' })).toBe(false);
    expect(isAdultAccountUser({})).toBe(false);
  });

  it('max adult DOB is asOf minus 18 years', () => {
    const asOf = new Date(2026, 0, 15);
    const max = getMaxDateForMinimumAge(MINIMUM_ACCOUNT_AGE, asOf);
    expect(max.getFullYear()).toBe(2008);
    expect(max.getMonth()).toBe(0);
    expect(max.getDate()).toBe(15);
  });
});
