export const PUBLIC_CONNECTION_MESSAGE =
  "Can't reach PanditTalk right now. Check your connection and try again.";

export const MISCONFIGURED_API_MESSAGE =
  "This install can't reach PanditTalk. The server address in this build needs to be updated.";

function hostnameOf(apiBase: string): string | null {
  const trimmed = apiBase.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Local, emulator, and private-LAN hosts are development addresses, not the public API. */
export function isPrivateOrLocalApiBase(apiBase: string): boolean {
  const host = hostnameOf(apiBase);
  if (!host) return true;
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '10.0.2.2' ||
    host.endsWith('.local')
  ) {
    return true;
  }
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);
}

export function connectionFailureCopy(apiBase: string): string {
  return isPrivateOrLocalApiBase(apiBase) ? MISCONFIGURED_API_MESSAGE : PUBLIC_CONNECTION_MESSAGE;
}
