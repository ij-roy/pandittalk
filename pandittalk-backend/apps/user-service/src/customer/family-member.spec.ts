import { BadRequestException } from '@nestjs/common';
import { parseFamilyMemberInput } from './family-member';

describe('parseFamilyMemberInput', () => {
  const valid = {
    relation: 'child',
    name: 'Anaya',
    dob: '2018-06-01',
    timeOfBirth: '08:30',
    placeOfBirth: 'Pune',
  };

  it('accepts a child profile', () => {
    expect(parseFamilyMemberInput(valid)).toMatchObject({
      relation: 'child',
      name: 'Anaya',
      placeOfBirth: 'Pune',
    });
  });

  it('rejects an unknown relation', () => {
    expect(() =>
      parseFamilyMemberInput({ ...valid, relation: 'cousin' }),
    ).toThrow(BadRequestException);
  });

  it('rejects a bad date', () => {
    expect(() =>
      parseFamilyMemberInput({ ...valid, dob: '01-06-2018' }),
    ).toThrow(BadRequestException);
  });
});
