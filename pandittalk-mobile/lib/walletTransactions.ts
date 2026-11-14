export type ParsedWalletTransaction = {
  id: string;
  type: string;
  amount: number;
  coinsAmount: number;
  amountInr: number;
  description: string | null;
  createdAt: string;
  status: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const record = asRecord(value);
  if (!record) return null;
  if (Array.isArray(record.d) && typeof record.e === 'number' && (record.s === 1 || record.s === -1)) {
    const chunks = record.d.filter((part): part is number => typeof part === 'number');
    if (chunks.length > 0) {
      const digits = chunks
        .map((part, index) =>
          index === 0 ? String(Math.abs(part)) : String(Math.abs(part)).padStart(7, '0'),
        )
        .join('');
      const coefficient = Number(digits);
      if (Number.isFinite(coefficient)) {
        return record.s * coefficient * 10 ** (record.e - digits.length + 1);
      }
    }
  }
  if ('value' in record) return readNumber(record.value);
  return null;
}

function firstNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    if (!(key in record)) continue;
    const parsed = readNumber(record[key]);
    if (parsed !== null) return parsed;
  }
  return null;
}

function readId(record: Record<string, unknown>): string | null {
  const raw = record.id ?? record.transactionId ?? record.transaction_id;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return null;
}

function readDate(record: Record<string, unknown>): string {
  const raw = record.createdAt ?? record.created_at ?? record.timestamp ?? record.date;
  if (typeof raw === 'string' && !Number.isNaN(Date.parse(raw))) return raw;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return '';
}

function transactionRecord(raw: unknown): Record<string, unknown> | null {
  const record = asRecord(raw);
  if (!record) return null;
  const nested = asRecord(record.transaction);
  if (nested && readId(nested)) return nested;
  return record;
}

export function normalizeWalletTransaction(raw: unknown): ParsedWalletTransaction | null {
  const record = transactionRecord(raw);
  if (!record) return null;
  const id = readId(record);
  if (!id) return null;

  const coinsAmount =
    firstNumber(record, ['coinsAmount', 'coins_amount', 'coinAmount', 'coin_amount', 'coins', 'delta']) ??
    0;
  const amountInr = firstNumber(record, ['amountInr', 'amount_inr', 'priceInr', 'price_inr']) ?? 0;
  const description =
    typeof record.description === 'string'
      ? record.description
      : typeof record.note === 'string'
        ? record.note
        : typeof record.title === 'string'
          ? record.title
          : null;

  return {
    id,
    type: typeof record.type === 'string'
      ? record.type
      : typeof record.transactionType === 'string'
        ? record.transactionType
        : typeof record.transaction_type === 'string'
          ? record.transaction_type
          : 'unknown',
    amount: coinsAmount || amountInr,
    coinsAmount,
    amountInr,
    description,
    createdAt: readDate(record),
    status: typeof record.status === 'string' ? record.status : null,
  };
}

function listFrom(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return null;
  for (const key of ['data', 'items', 'results', 'transactions', 'history']) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return null;
}

export function walletTransactionList(payload: unknown): ParsedWalletTransaction[] {
  const root = asRecord(payload) ?? {};
  const wallet = asRecord(root.wallet) ?? asRecord(asRecord(root.data)?.wallet) ?? asRecord(root.data) ?? root;
  const candidates = [
    wallet.transactions,
    wallet.history,
    wallet.items,
    root.transactions,
    root.history,
  ];
  for (const candidate of candidates) {
    const list = listFrom(candidate);
    if (!list) continue;
    return list
      .map(normalizeWalletTransaction)
      .filter((row): row is ParsedWalletTransaction => row !== null);
  }
  return [];
}
