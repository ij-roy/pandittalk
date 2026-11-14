const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Short support code, e.g. PT-K7M2QX. Logged as error_reference= so crash tools can tag it later. */
export function createErrorReference(): string {
  let body = '';
  for (let i = 0; i < 6; i += 1) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `PT-${body}`;
}

export function logErrorReference(reference: string, error: unknown): void {
  console.error(`[error_reference=${reference}]`, error);
}
