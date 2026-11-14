import { BadRequestException } from '@nestjs/common';

export const FAMILY_RELATIONS = ['spouse', 'child', 'parent', 'other'] as const;
export type FamilyRelation = (typeof FAMILY_RELATIONS)[number];
export const MAX_FAMILY_MEMBERS = 8;

export type FamilyMemberInput = {
  relation: FamilyRelation;
  name: string;
  dob: string;
  timeOfBirth: string;
  placeOfBirth: string;
  coordinates?: string;
};

export function parseFamilyMemberInput(raw: {
  relation?: string;
  name?: string;
  dob?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  coordinates?: string;
}): FamilyMemberInput {
  const relation = raw.relation?.trim().toLowerCase();
  if (!relation || !FAMILY_RELATIONS.includes(relation as FamilyRelation)) {
    throw new BadRequestException('Choose spouse, child, parent, or other');
  }
  const name = raw.name?.trim() ?? '';
  if (name.length < 2 || name.length > 80) {
    throw new BadRequestException('Enter a name');
  }
  const dob = raw.dob?.trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    throw new BadRequestException('Date of birth must be YYYY-MM-DD');
  }
  const timeOfBirth = raw.timeOfBirth?.trim() ?? '';
  if (!/^\d{2}:\d{2}$/.test(timeOfBirth)) {
    throw new BadRequestException('Time of birth must be HH:mm');
  }
  const placeOfBirth = raw.placeOfBirth?.trim() ?? '';
  if (placeOfBirth.length < 2 || placeOfBirth.length > 120) {
    throw new BadRequestException('Enter a place of birth');
  }
  const coordinates = raw.coordinates?.trim();
  return {
    relation: relation as FamilyRelation,
    name,
    dob,
    timeOfBirth,
    placeOfBirth,
    coordinates: coordinates ? coordinates : undefined,
  };
}
