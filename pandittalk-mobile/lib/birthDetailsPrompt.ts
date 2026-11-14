const BIRTH_FIELD_LABELS = {
  dob: 'date of birth',
  timeOfBirth: 'time of birth',
  placeOfBirth: 'place of birth',
} as const;

export type BirthFieldId = keyof typeof BIRTH_FIELD_LABELS;

function filled(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function missingBirthFields(
  user: Record<string, unknown> | null | undefined,
): BirthFieldId[] {
  return (Object.keys(BIRTH_FIELD_LABELS) as BirthFieldId[]).filter(
    (key) => !filled(user?.[key]),
  );
}

export function birthDetailsPrompt(missing: BirthFieldId[]): string | null {
  if (missing.length === 0) return null;
  if (missing.length === 3) {
    return 'Add your date, time, and place of birth to your profile.';
  }
  const names = missing.map((key) => BIRTH_FIELD_LABELS[key]);
  if (names.length === 1) return `Add your ${names[0]} to your profile.`;
  return `Add your ${names[0]} and ${names[1]} to your profile.`;
}
