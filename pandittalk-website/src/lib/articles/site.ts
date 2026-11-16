export const SITE_URL = (
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://www.pandittalk.com'
).replace(/\/$/, '');

export const API_BASE = (
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  'https://pandittalk-load-balancer.admininfo-6d6.workers.dev'
).replace(/\/$/, '');

export const PLAY_STORE_URL =
  process.env.PLAY_STORE_URL ||
  'https://play.google.com/store/apps/details?id=com.pandittalk.mobile';

export const DASHBOARD_URL = (
  process.env.DASHBOARD_URL || 'https://dashboard.pandittalk.com'
).replace(/\/$/, '');

export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
