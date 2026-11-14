/**
 * Strict allowlist for in-app WebViews (settings legal docs + login Terms/Privacy).
 * Prevents crafted deep links from loading arbitrary phishing hosts inside app chrome.
 */

const DEFAULT_ALLOWED_HOSTS = ['www.pandittalk.com', 'pandittalk.com'] as const;

function hostFromBaseUrl(base: string): string | null {
  try {
    const u = new URL(base.includes('://') ? base : `https://${base}`);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Allowed HTTPS hosts for WebView: production legal base + optional EXPO_PUBLIC_LEGAL_BASE host.
 */
export function getAllowedWebViewHosts(
  legalBaseUrl: string = process.env.EXPO_PUBLIC_LEGAL_BASE?.trim() ||
    'https://www.pandittalk.com',
): readonly string[] {
  const hosts = new Set<string>(DEFAULT_ALLOWED_HOSTS);
  const fromEnv = hostFromBaseUrl(legalBaseUrl.replace(/\/$/, ''));
  if (fromEnv) hosts.add(fromEnv);
  return [...hosts];
}

export type WebViewUrlResolution =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * Resolve a candidate WebView URL. Rejects non-HTTPS, malformed URLs, and hosts
 * outside the PanditTalk allowlist. Empty/missing input uses `fallbackUrl` (also validated).
 */
export function resolveAllowedWebViewUrl(
  raw: string | undefined | null,
  fallbackUrl: string,
  allowedHosts: readonly string[] = getAllowedWebViewHosts(),
): WebViewUrlResolution {
  const candidate =
    typeof raw === 'string' && raw.trim() ? raw.trim() : fallbackUrl.trim();

  if (!candidate) {
    return { ok: false, reason: 'Document URL missing.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, reason: 'Invalid document URL.' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only HTTPS legal pages are allowed.' };
  }

  const host = parsed.hostname.toLowerCase();
  if (!allowedHosts.includes(host)) {
    return { ok: false, reason: 'This page is not available in the app browser.' };
  }

  // Strip credentials / hash noise; keep path+query for legal deep links.
  parsed.username = '';
  parsed.password = '';
  return { ok: true, url: parsed.toString() };
}

/** True when a navigation request (initial or in-page) may proceed. */
export function isAllowedWebViewNavigation(
  url: string,
  allowedHosts: readonly string[] = getAllowedWebViewHosts(),
): boolean {
  return resolveAllowedWebViewUrl(url, url, allowedHosts).ok;
}
