import axios from 'axios';

import { API_BASE } from '@/lib/authApi';
import { useAuthStore } from '@/store/useAuthStore';
import { walletTransactionList } from '@/lib/walletTransactions';

export type WalletTransaction = {
  id: string;
  type: string;
  /** Legacy normalized amount; prefer coinsAmount. */
  amount: number;
  coinsAmount: number;
  amountInr: number;
  description: string | null;
  createdAt: string;
  status: string | null;
};

export type CoinPackage = {
  id: string;
  coins: number;
  bonusCoins: number;
  priceInr: number;
  /** Same as priceInr; kept for callers that used `amount`. */
  amount: number;
  currency: string;
  label: string | null;
  isPopular: boolean;
};

export type WalletData = {
  coinBalance: number;
  transactions: WalletTransaction[];
  packages: CoinPackage[];
};

export type OrderData = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  package?: CoinPackage;
};

export type VerifyPaymentPayload = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export type VerifyResult = {
  success: boolean;
  coinsAdded: number;
  newBalance: number;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function unwrapWallet(payload: unknown): Record<string, unknown> | null {
  const o = asRecord(payload);
  if (!o) return null;
  const wallet = asRecord(o.wallet);
  if (wallet) return wallet;
  const data = asRecord(o.data);
  if (data) {
    const nestedWallet = asRecord(data.wallet);
    if (nestedWallet) return nestedWallet;
    return data;
  }
  return o;
}

function unwrapVerifyResult(payload: unknown): Record<string, unknown> | null {
  const o = asRecord(payload);
  if (!o) return null;
  const data = asRecord(o.data);
  return data ?? o;
}

function normalizeCoinPackage(raw: unknown): CoinPackage | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = str(o.id ?? o.coinPackageId ?? o.coin_package_id);
  if (!id) return null;
  const isPopularRaw = o.isPopular ?? o.is_popular ?? o.popular;
  const priceInr = num(o.priceInr ?? o.price_inr ?? o.price ?? o.amount);
  const bonusCoins = num(o.bonusCoins ?? o.bonus_coins ?? o.bonus);
  return {
    id,
    coins: num(o.coins ?? o.coinAmount ?? o.coin_amount),
    bonusCoins,
    priceInr,
    amount: priceInr,
    currency: str(o.currency, 'INR'),
    label:
      typeof o.label === 'string'
        ? o.label
        : typeof o.name === 'string'
          ? o.name
          : null,
    isPopular:
      isPopularRaw === true ||
      isPopularRaw === 'true' ||
      isPopularRaw === 1 ||
      isPopularRaw === '1',
  };
}

function unwrapList(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  const o = asRecord(payload);
  if (!o) return [];
  for (const key of keys) {
    const v = o[key];
    if (Array.isArray(v)) return v;
  }
  const data = asRecord(o.data);
  if (data) {
    for (const key of keys) {
      const v = data[key];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function normalizeWalletData(payload: unknown): WalletData {
  const root = unwrapWallet(payload) ?? {};
  const coinBalance = num(root.coinBalance ?? root.coin_balance ?? root.balance);
  const transactions = walletTransactionList(payload);
  const packages = unwrapList(root, ['packages', 'coinPackages', 'coin_packages'])
    .map(normalizeCoinPackage)
    .filter(Boolean) as CoinPackage[];

  return { coinBalance, transactions, packages };
}

function normalizeVerifyResult(payload: unknown): VerifyResult {
  const o = unwrapVerifyResult(payload);
  if (!o) {
    throw new Error('Invalid payment verification response');
  }
  return {
    success: o.success === true || o.success === 'true' || o.success === 1,
    coinsAdded: num(o.coinsAdded ?? o.coins_added),
    newBalance: num(o.newBalance ?? o.new_balance ?? o.coinBalance ?? o.coin_balance),
  };
}

/** `GET /wallet` — balance, transactions, and purchasable packages. */
export async function getWallet(accessToken: string): Promise<WalletData> {
  const res = await axios.get(`${API_BASE}/wallet`, {
    headers: authHeaders(accessToken),
  });
  return normalizeWalletData(res.data);
}

/** Re-fetch `GET /wallet` and sync balance into the auth store. */
export async function refreshWalletBalance(accessToken: string): Promise<number> {
  const wallet = await getWallet(accessToken);
  useAuthStore.getState().setWalletBalance(wallet.coinBalance);
  return wallet.coinBalance;
}

/** `POST /wallet/create-order` — Razorpay order for a coin package. */
export async function createOrder(
  accessToken: string,
  coinPackageId: string,
): Promise<OrderData> {
  const res = await axios.post(
    `${API_BASE}/wallet/create-order`,
    { coinPackageId },
    { headers: authHeaders(accessToken) },
  );
  const response = res.data as Record<string, unknown> | undefined;
  const dataLayer = asRecord(response?.data);
  const order =
    asRecord(dataLayer?.order) ??
    dataLayer ??
    asRecord(response?.order) ??
    asRecord(response) ??
    {};

  const orderId = str(order.orderId ?? order.order_id ?? order.id);
  const keyId = str(order.keyId ?? order.key_id ?? order.key);
  const amount = Math.round(num(order.amount ?? order.amount_paise ?? order.amountPaise));
  const currency = str(order.currency, 'INR');

  if (!orderId) {
    throw new Error('Create order response is missing orderId');
  }
  if (!keyId) {
    throw new Error('Create order response is missing keyId (Razorpay key)');
  }
  if (!amount || amount <= 0) {
    throw new Error('Create order response is missing or invalid amount');
  }

  const pkgRaw = order.package ?? order.coinPackage ?? order.coin_package;
  const pkg = pkgRaw ? normalizeCoinPackage(pkgRaw) : undefined;

  return {
    orderId,
    amount,
    currency,
    keyId,
    ...(pkg ? { package: pkg } : {}),
  };
}

/** `POST /wallet/verify-payment` — confirm Razorpay payment and credit coins. */
export async function verifyPayment(
  accessToken: string,
  payload: VerifyPaymentPayload,
): Promise<VerifyResult> {
  const res = await axios.post(`${API_BASE}/wallet/verify-payment`, payload, {
    headers: authHeaders(accessToken),
  });
  return normalizeVerifyResult(res.data);
}

export type GstInvoice = {
  invoiceNumber: string;
  taxableInr: string;
  gstInr: string;
  totalInr: string;
  text: string;
};

/** `GET /wallet/transactions/:id/invoice` — GST-inclusive tax invoice for a paid recharge. */
export async function fetchGstInvoice(
  accessToken: string,
  transactionId: string,
): Promise<GstInvoice> {
  const res = await axios.get(
    `${API_BASE}/wallet/transactions/${encodeURIComponent(transactionId)}/invoice`,
    { headers: authHeaders(accessToken) },
  );
  const root = asRecord(res.data) ?? {};
  const data = asRecord(root.data) ?? root;
  const text = typeof data.text === 'string' ? data.text : '';
  if (!text) {
    throw new Error('Invoice was empty');
  }
  return {
    invoiceNumber: str(data.invoiceNumber),
    taxableInr: str(data.taxableInr),
    gstInr: str(data.gstInr),
    totalInr: str(data.totalInr),
    text,
  };
}
