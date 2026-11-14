export const PROFILE_ADD_LABEL = 'Add';

export function profileFieldValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
