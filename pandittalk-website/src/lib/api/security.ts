export function safeReturnTo(value: unknown): string {
  return typeof value === 'string' && /^\/(?:home|pandits|guidance|tools|wallet|bookings|sessions|reports|notifications|account|profile-setup|articles|help|download|how-it-works|pricing|trust|contact|for-pandits)(?:\/[a-zA-Z0-9_-]+)*$/.test(value) ? value : '/home';
}
// Allow-list only. Product pauses for POST /bookings, /bookings/chat-now,
// /tools/unlock and /wallet/create-order live in api/backend/[...path]/route.ts
// (503). Keep those routes listed here so the pause handlers still run.
const routes: Record<string, RegExp[]> = {
  GET: [/^\/experts(?:\/(?!me$)[\w-]+)?$/, /^\/users\/profile$/, /^\/users\/contexts$/, /^\/users\/notification-preferences$/, /^\/wallet$/, /^\/bookings(?:\/(?:chat-now\/queue|pandit\/[\w-]+\/status|[\w-]+))?$/, /^\/reports(?:\/[\w-]+)?$/, /^\/notifications(?:\/unread-count)?$/, /^\/tools\/unlocked$/, /^\/sessions\/(?:audio|video)\/[\w-]+$/],
  POST: [/^\/users\/profile\/avatar$/, /^\/users\/contexts$/, /^\/users\/contexts\/[\w-]+\/share$/, /^\/users\/phone-change\/(?:request|verify)$/, /^\/support\/requests$/, /^\/pandit-applications$/, /^\/wallet\/(?:create-order|verify-payment)$/, /^\/bookings(?:\/chat-now(?:\/queue)?|\/[\w-]+\/review)?$/, /^\/tools\/(?:kundli|horoscope|compatibility|tarot|palm-reading|monthly-horoscope|unlock)$/, /^\/sessions\/(?:audio|video)\/join$/],
  PATCH: [/^\/users\/profile$/, /^\/users\/contexts\/[\w-]+$/, /^\/users\/notification-preferences$/, /^\/bookings\/[\w-]+\/status$/, /^\/notifications\/(?:read-all|[\w-]+\/read)$/],
  DELETE: [/^\/users\/profile$/, /^\/users\/contexts\/[\w-]+$/, /^\/users\/contexts\/[\w-]+\/share\/[\w-]+$/, /^\/bookings\/chat-now\/queue$/],
};
export function allowedEndpoint(method: string, path: string): boolean {
  if (/[.%\\?#]/.test(path)) return false;
  return routes[method]?.some(rule => rule.test(path)) ?? false;
}
export function trustedMutation(expected: string, origin: string | null, content: string | null): boolean {
  return origin === expected && !!content && /^(application\/json|multipart\/form-data)(?:;|$)/i.test(content);
}
export function normalizePhone(value: string): string | null {
  const clean = value.replace(/[\s()-]/g, '');
  if (/^[6-9]\d{9}$/.test(clean)) return `+91${clean}`;
  return /^\+91[6-9]\d{9}$/.test(clean) ? clean : null;
}
