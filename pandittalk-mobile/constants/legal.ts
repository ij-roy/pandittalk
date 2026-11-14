/**
 * Public legal document URLs and version stamps for auth consent.
 * Keep versions in sync with backend `legal-consent.constants.ts`.
 */
export const LEGAL_TERMS_VERSION = '2.0';
export const LEGAL_PRIVACY_VERSION = '2.0';

const DEFAULT_LEGAL_BASE = 'https://www.pandittalk.com';

function legalBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_LEGAL_BASE;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  return DEFAULT_LEGAL_BASE;
}

export function getTermsUrl(): string {
  return `${legalBase()}/terms-and-conditions`;
}

export function getPrivacyPolicyUrl(): string {
  return `${legalBase()}/privacy`;
}

export function getHelpCenterUrl(): string {
  return `${legalBase()}/help`;
}

/** Canonical www path (also aliased as /refund-policy → this via website redirects). */
export function getRefundPolicyUrl(): string {
  return `${legalBase()}/refund-and-cancellation-policy`;
}

/** Canonical www path (also aliased as /account-deletion → this via website redirects). */
export function getAccountDeletionUrl(): string {
  return `${legalBase()}/delete-account`;
}

export function getDisclaimerUrl(): string {
  return `${legalBase()}/disclaimer`;
}

export function getChangePhoneUrl(): string {
  return `${legalBase()}/account/phone`;
}

/** Canonical support inbox — keep in sync with website siteIdentity.supportEmail */
export const SUPPORT_EMAIL = 'admininfo@pandittalk.com';

export const LEGAL_CONSENT_LABEL =
  'I am 18+ and agree to the Terms & Conditions and Privacy Policy';

/** Shown on tools / guidance — Guideline 4.3 / not medical advice. */
export const ENTERTAINMENT_DISCLAIMER =
  'Guidance is for entertainment and spiritual reflection only. It is not medical, legal, or financial advice.';
