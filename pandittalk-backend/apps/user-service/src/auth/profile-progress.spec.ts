import {
  PROFILE_PROGRESS_FLOOR,
  computeProfileProgress,
} from './profile-progress';

describe('computeProfileProgress', () => {
  it('never returns below the floor once a phone is present', () => {
    const result = computeProfileProgress({ phoneNumber: '+919999999999' });
    expect(result.percent).toBe(PROFILE_PROGRESS_FLOOR);
    expect(result.percent).toBeGreaterThan(0);
  });

  it('never returns 0% even with an empty profile', () => {
    const result = computeProfileProgress({});
    expect(result.percent).toBe(PROFILE_PROGRESS_FLOOR);
  });

  it('adds name and Google email on top of the phone floor', () => {
    const result = computeProfileProgress({
      phoneNumber: '+919999999999',
      firstName: 'Priya',
      lastName: 'Shah',
      email: 'priya@gmail.com',
    });
    expect(result.percent).toBe(25 + 10 + 15);
    expect(result.items.find((i) => i.id === 'email')?.complete).toBe(true);
  });

  it('counts birth only when date, time, and place are all present', () => {
    const partial = computeProfileProgress({
      phoneNumber: '+919999999999',
      dob: '1995-08-21',
    });
    expect(partial.items.find((i) => i.id === 'birth')?.complete).toBe(false);

    const full = computeProfileProgress({
      phoneNumber: '+919999999999',
      dob: '1995-08-21',
      timeOfBirth: '14:30',
      placeOfBirth: 'Mumbai',
    });
    expect(full.items.find((i) => i.id === 'birth')?.complete).toBe(true);
    expect(full.percent).toBe(25 + 35);
  });

  it('reaches 100 when every slice is filled', () => {
    const result = computeProfileProgress({
      phoneNumber: '+919999999999',
      firstName: 'Priya',
      email: 'priya@gmail.com',
      profileImageUrl: 'https://example.com/p.jpg',
      gender: 'female',
      dob: '1995-08-21',
      timeOfBirth: '14:30',
      placeOfBirth: 'Mumbai',
    });
    expect(result.percent).toBe(100);
  });
});
