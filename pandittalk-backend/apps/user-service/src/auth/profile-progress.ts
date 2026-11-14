export const PROFILE_PROGRESS_FLOOR = 25;

export type ProfileProgressInput = {
  phoneNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  gender?: string | null;
  dob?: string | null;
  timeOfBirth?: string | null;
  placeOfBirth?: string | null;
};

export type ProfileProgressItemId =
  | 'phone'
  | 'name'
  | 'email'
  | 'photo'
  | 'gender'
  | 'birth';

export type ProfileProgressItem = {
  id: ProfileProgressItemId;
  label: string;
  complete: boolean;
  weight: number;
};

export type ProfileProgress = {
  percent: number;
  items: ProfileProgressItem[];
};

function filled(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function computeProfileProgress(
  input: ProfileProgressInput,
): ProfileProgress {
  const hasName =
    filled(input.firstName) || filled(input.lastName) || filled(input.name);
  const hasBirth =
    filled(input.dob) &&
    filled(input.timeOfBirth) &&
    filled(input.placeOfBirth);

  const items: ProfileProgressItem[] = [
    {
      id: 'phone',
      label: 'Mobile verified',
      complete: filled(input.phoneNumber),
      weight: PROFILE_PROGRESS_FLOOR,
    },
    {
      id: 'name',
      label: 'Name',
      complete: hasName,
      weight: 10,
    },
    {
      id: 'email',
      label: 'Google connected',
      complete: filled(input.email),
      weight: 15,
    },
    {
      id: 'photo',
      label: 'Photo',
      complete: filled(input.profileImageUrl),
      weight: 5,
    },
    {
      id: 'gender',
      label: 'Gender',
      complete: filled(input.gender),
      weight: 10,
    },
    {
      id: 'birth',
      label: 'Birth details',
      complete: hasBirth,
      weight: 35,
    },
  ];

  const earned = items.reduce(
    (sum, item) => sum + (item.complete ? item.weight : 0),
    0,
  );
  const percent = Math.min(100, Math.max(PROFILE_PROGRESS_FLOOR, earned));

  return { percent, items };
}
