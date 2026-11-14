export function coinBalanceFromProfilePayload(raw: unknown): number | undefined {
  const visit = (node: unknown): number | undefined => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return undefined;
    const o = node as Record<string, unknown>;
    const b = o.coinBalance ?? o.coin_balance;
    if (typeof b === 'number' && Number.isFinite(b)) return b;
    if (typeof b === 'string' && b.trim()) {
      const n = Number(b);
      if (Number.isFinite(n)) return n;
    }
    return undefined;
  };
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  return visit(o) ?? visit(o.data) ?? visit(o.user) ?? visit(o.profile);
}
