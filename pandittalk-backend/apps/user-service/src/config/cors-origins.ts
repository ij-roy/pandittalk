const LOCAL_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];

const PRODUCT_ORIGINS = [
  'https://www.pandittalk.com',
  'https://pandittalk.com',
  'https://dashboard.pandittalk.com',
];

export function parseAllowedOrigins(raw?: string): string[] {
  const fromEnv = raw?.trim()
    ? raw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : LOCAL_ORIGINS;

  return [...new Set([...fromEnv, ...PRODUCT_ORIGINS])];
}
