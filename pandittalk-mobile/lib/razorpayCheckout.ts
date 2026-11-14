import RazorpayCheckout from 'react-native-razorpay';

import type { OrderData } from '@/lib/walletApi';

export type RazorpayOpenOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { contact: string };
  theme?: { color: string };
};

/** Backend / Razorpay Orders API amount is already in paise — never multiply by 100 again. */
export function razorpayAmountPaise(raw: number | string | undefined): number {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid Razorpay amount (expected paise): ${String(raw)}`);
  }
  return n;
}

export function buildRazorpayOptions(
  order: OrderData,
  description: string,
  contact?: string,
): RazorpayOpenOptions {
  const amount = razorpayAmountPaise(order.amount);
  const options: RazorpayOpenOptions = {
    key: order.keyId,
    amount,
    currency: order.currency || 'INR',
    order_id: order.orderId,
    name: 'PanditTalk',
    description,
  };
  if (contact?.trim()) {
    options.prefill = { contact: contact.trim() };
  }
  return options;
}

export async function openRazorpayCheckout(options: RazorpayOpenOptions) {
  return RazorpayCheckout.open(options);
}

/** Minimal checkout to isolate the native module from live order options. */
export async function runRazorpayDiagnosticTest(): Promise<void> {
  const key = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID?.trim();
  if (!key) {
    throw new Error(
      'Set EXPO_PUBLIC_RAZORPAY_KEY_ID in .env (Razorpay test Key ID only).',
    );
  }

  await RazorpayCheckout.open({
    key,
    amount: 19900,
    currency: 'INR',
    name: 'PanditTalk Test',
  });
}
