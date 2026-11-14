import { parseAllowedOrigins } from './cors-origins';

describe('parseAllowedOrigins', () => {
  it('includes local and product origins when unset', () => {
    const origins = parseAllowedOrigins(undefined);
    expect(origins).toEqual(
      expect.arrayContaining([
        'http://localhost:5173',
        'http://localhost:3000',
        'https://www.pandittalk.com',
        'https://dashboard.pandittalk.com',
      ]),
    );
  });

  it('merges www even when secrets omit it', () => {
    const origins = parseAllowedOrigins(
      'https://dashboard.pandittalk.com,https://pandittalk.com',
    );
    expect(origins).toContain('https://www.pandittalk.com');
    expect(origins).toContain('https://dashboard.pandittalk.com');
  });
});
