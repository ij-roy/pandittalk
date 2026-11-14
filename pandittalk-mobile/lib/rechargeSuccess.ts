const EXPERT_PATH =
  /^\/experts\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FIXED_RETURN_PATHS = new Set(['/tools/kundli-detailed', '/tools/monthly-horoscope', '/guidance/flow']);

/** Only in-app paths we intentionally send people back to after a recharge. */
export function safeRechargeReturn(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return null;
  const path = value.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('..') || path.includes('://')) {
    return null;
  }
  if (FIXED_RETURN_PATHS.has(path) || EXPERT_PATH.test(path)) return path;
  return null;
}

export function rechargeSuccessLabel(returnTo: string | null): string {
  if (!returnTo) return 'Done';
  if (returnTo.startsWith('/experts/')) return 'Back to pandit';
  return 'Continue';
}

/** Inclusive end value, used to count the balance up after payment. */
export function balanceCountSteps(from: number, to: number, steps = 12): number[] {
  const start = Number.isFinite(from) ? Math.max(0, Math.round(from)) : 0;
  const end = Number.isFinite(to) ? Math.max(0, Math.round(to)) : 0;
  if (end <= start) return [end];
  const count = Math.max(1, steps);
  const values: number[] = [];
  for (let i = 1; i <= count; i += 1) {
    values.push(Math.round(start + ((end - start) * i) / count));
  }
  if (values[values.length - 1] !== end) values.push(end);
  return values;
}
