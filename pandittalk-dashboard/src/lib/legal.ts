/** Keep in sync with backend legal-consent.constants.ts and mobile constants/legal.ts */
export const LEGAL_TERMS_VERSION = '2.0';
export const LEGAL_PRIVACY_VERSION = '2.0';

/** In-app routes — always public, no login required. */
export const TERMS_PATH = '/terms';
export const PRIVACY_POLICY_PATH = '/privacy-policy';

const DEFAULT_LEGAL_BASE = 'https://dashboard.pandittalk.com';

function legalBase(): string {
  const fromEnv = import.meta.env.VITE_LEGAL_BASE as string | undefined;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  // Prefer same-origin when the dashboard is serving these pages.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_LEGAL_BASE;
}

export function getTermsUrl(): string {
  return `${legalBase()}${TERMS_PATH}`;
}

export function getPrivacyPolicyUrl(): string {
  return `${legalBase()}${PRIVACY_POLICY_PATH}`;
}
