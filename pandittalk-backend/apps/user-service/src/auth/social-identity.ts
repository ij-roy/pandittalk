export type SocialProvider = 'google' | 'apple';

export type SocialIdentity = {
  provider: SocialProvider;
  subject: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  pictureUrl: string | null;
};

export type SocialPendingRecord = SocialIdentity & {
  acceptedLegalConsent: true;
};
