function base64UrlDecode(input: string): string | null {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(padded);
    }
    const lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    for (let i = 0; i < padded.length; i += 4) {
      const enc1 = lookup.indexOf(padded[i] ?? '');
      const enc2 = lookup.indexOf(padded[i + 1] ?? '');
      const enc3 = lookup.indexOf(padded[i + 2] ?? '');
      const enc4 = lookup.indexOf(padded[i + 3] ?? '');
      if (enc1 < 0 || enc2 < 0) return null;
      const chr1 = (enc1 << 2) | (enc2 >> 4);
      output += String.fromCharCode(chr1);
      if (enc3 >= 64) continue;
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      output += String.fromCharCode(chr2);
      if (enc4 >= 64) continue;
      const chr3 = ((enc3 & 3) << 6) | enc4;
      output += String.fromCharCode(chr3);
    }
    return output;
  } catch {
    return null;
  }
}

/** Returns true when JWT `exp` is in the past (with small clock skew). */
export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  const parts = token.split('.');
  if (parts.length < 2) return false;
  const decoded = base64UrlDecode(parts[1] ?? '');
  if (!decoded) return false;
  try {
    const payload = JSON.parse(decoded) as { exp?: unknown };
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return false;
    return Date.now() >= (payload.exp - skewSeconds) * 1000;
  } catch {
    return false;
  }
}
