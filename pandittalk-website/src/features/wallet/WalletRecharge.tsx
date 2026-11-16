'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, useApi } from '@/lib/api/client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { LoadingState } from '@/components/site/Skeleton';
import styles from './walletRecharge.module.css';

type CoinPackage = {
  id: string;
  label?: string | null;
  coins: number;
  bonusCoins: number;
  priceInr: number | string;
  isPopular?: boolean;
};

type WalletData = {
  coinBalance: number;
  paymentsEnabled?: boolean;
  packages: CoinPackage[];
};

type CreateOrderResponse = {
  orderId: string;
  amount: number | string;
  currency: string;
  keyId: string;
  package?: { label?: string; coins?: number; bonusCoins?: number; priceInr?: number | string };
};

type VerifyPaymentResponse = { success: boolean; coinsAdded: number; newBalance: number };
type RazorpayPayment = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayFailure = { error?: { description?: string }; description?: string };
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  theme: { color: string };
  handler: (payment: RazorpayPayment) => void;
  modal?: { ondismiss?: () => void };
};
type RazorpayInstance = { open: () => void; on?: (event: 'payment.failed', handler: (failure: RazorpayFailure) => void) => void };
type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window { Razorpay?: RazorpayConstructor }
}

let razorpayScript: Promise<void> | undefined;

function loadRazorpay(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Payments can only start in a browser.'));
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScript) return razorpayScript;
  razorpayScript = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pandit-talk-razorpay]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('The secure payment window could not load. Try again.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.panditTalkRazorpay = 'true';
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); reject(new Error('The secure payment window could not load. Try again.')); };
    document.head.appendChild(script);
  }).then(() => {
    if (!window.Razorpay) throw new Error('The secure payment window could not load. Try again.');
  }).finally(() => { razorpayScript = undefined; });
  return razorpayScript;
}

function asNumber(value: number | string | undefined, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function totalCoins(pkg: CoinPackage) { return pkg.coins + Math.max(0, pkg.bonusCoins); }

function rupees(value: number | string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(asNumber(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The payment could not be started. Nothing was confirmed or charged.';
}

function failureMessage(failure: RazorpayFailure) {
  return failure.description || failure.error?.description || 'The payment was cancelled or declined. Check your wallet before trying again.';
}

export function WalletRecharge() {
  const wallet = useApi<WalletData>('/wallet');
  const [selectedId, setSelectedId] = useState<string>();
  const [stage, setStage] = useState<'idle' | 'starting' | 'verifying' | 'success' | 'cancelled' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState<{ coins: number; balance: number }>();
  const [paymentReference, setPaymentReference] = useState('');
  const settled = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const paymentsEnabled = wallet.data?.paymentsEnabled !== false;
  const packages = useMemo(() => paymentsEnabled
    ? (wallet.data?.packages ?? []).filter(pkg => pkg.id && pkg.coins > 0 && asNumber(pkg.priceInr) > 0)
    : [], [paymentsEnabled, wallet.data]);
  const selected = packages.find(pkg => pkg.id === selectedId) ?? packages[0];
  const busy = stage === 'starting' || stage === 'verifying';

  useEffect(() => {
    if (!selectedId && packages[0]) setSelectedId(packages[0].id);
  }, [packages, selectedId]);

  useEffect(() => {
    if (!message && !success) return;
    requestAnimationFrame(() => statusRef.current?.focus({ preventScroll: true }));
  }, [message, success]);

  const startPayment = useCallback(async () => {
    if (!selected || busy) return;
    setMessage('');
    setSuccess(undefined);
    settled.current = false;
    setStage('starting');
    try {
      const order = await api<CreateOrderResponse>('/wallet/create-order', {
        method: 'POST',
        body: JSON.stringify({ coinPackageId: selected.id }),
      });
      setPaymentReference(order.orderId);
      const amount = Math.round(asNumber(order.amount));
      if (!order.orderId || !order.keyId || amount <= 0 || !order.currency) throw new Error('The payment order was incomplete. Nothing was charged.');
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('The secure payment window could not load. Try again.');

      const finishVerification = async (payment: RazorpayPayment) => {
        if (settled.current) return;
        settled.current = true;
        if (payment.razorpay_order_id !== order.orderId) {
          setStage('error');
          setMessage('The payment response did not match this order. Check payment status before trying again.');
          return;
        }
        setStage('verifying');
        try {
          const result = await api<VerifyPaymentResponse>('/wallet/verify-payment', {
            method: 'POST',
            body: JSON.stringify({
              razorpayOrderId: payment.razorpay_order_id,
              razorpayPaymentId: payment.razorpay_payment_id,
              razorpaySignature: payment.razorpay_signature,
            }),
          });
          if (result.success !== true) throw new Error('The payment was not verified. Check payment status before trying again.');
          setSuccess({ coins: result.coinsAdded, balance: result.newBalance });
          setStage('success');
          wallet.reload();
        } catch (error) {
          setStage('error');
          setMessage(`${errorMessage(error)} If money left your account, do not pay again until you check payment status.`);
        }
      };

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount,
        currency: order.currency,
        name: 'Pandit Talk',
        description: order.package?.label || selected.label || `${totalCoins(selected).toLocaleString('en-IN')} coins`,
        order_id: order.orderId,
        theme: { color: '#b88926' },
        handler: payment => { void finishVerification(payment); },
        modal: {
          ondismiss: () => {
            if (settled.current) return;
            settled.current = true;
            setStage('cancelled');
            setMessage(`Payment window closed. No coins were added here. Check payment status for order ${order.orderId} before trying again.`);
          },
        },
      });
      checkout.on?.('payment.failed', failure => {
        if (settled.current) return;
        settled.current = true;
        setStage('error');
        setMessage(`${failureMessage(failure)} Check payment status before trying again.`);
      });
      setStage('verifying');
      checkout.open();
    } catch (error) {
      setStage('error');
      setMessage(errorMessage(error));
    }
  }, [busy, selected, wallet]);

  return <main id="main-content" className="page stack" aria-busy={wallet.loading || busy || undefined}>
    <Link className="text-link" href="/wallet">← Your wallet</Link>
    <div>
      <p className="eyebrow">Wallet top-up</p>
      <h1>Add coins to your wallet</h1>
      <p className="lede">Choose a coin pack, review the amount in rupees, and pay securely with Razorpay. Your coins are added only after the server verifies the payment.</p>
    </div>

    {wallet.loading && <LoadingState label="Loading the available coin packs…" variant="cards" />}
    {wallet.error && <div className="error" role="alert"><p>{wallet.error.message}</p><button type="button" className="button secondary" onClick={wallet.reload}>Try again</button></div>}
    {wallet.data && !paymentsEnabled && <div className="notice" role="status"><strong>Wallet top-ups are temporarily unavailable.</strong><p>Your existing balance and transactions remain available. No payment window can open while wallet payments are paused; please check back later or contact support.</p></div>}
    {wallet.data && paymentsEnabled && packages.length === 0 && <div className="notice" role="status"><strong>No coin packs are available right now.</strong><p>Nothing can be charged from this page. Please check back later or contact support.</p></div>}

    {packages.length > 0 && <>
      <section className={styles.balancePanel} aria-label="Current wallet balance">
        <div><p className="eyebrow">Current balance</p><p className={styles.balance}>{wallet.data?.coinBalance.toLocaleString('en-IN')} <span>coins</span></p></div>
        <Link className="text-link" href="/wallet">View wallet history →</Link>
      </section>
      <section className="stack" aria-labelledby="coin-packs-title">
        <div><p className="eyebrow">Server-priced packs</p><h2 id="coin-packs-title">Choose how many coins to add</h2><p className="expert-meta">Pack availability, bonus coins, and prices come from your Pandit Talk account. We do not calculate or alter them in the browser.</p></div>
        <div className={styles.packGrid} role="list" aria-label="Available coin packs">
          {packages.map(pkg => {
            const total = totalCoins(pkg);
            const isSelected = selected?.id === pkg.id;
            return <div key={pkg.id} role="listitem">
              <button type="button" className={`${styles.pack} ${isSelected ? styles.packSelected : ''}`} aria-pressed={isSelected} onClick={() => setSelectedId(pkg.id)} disabled={busy}>
                {pkg.isPopular && <span className={styles.badge}>Most popular</span>}
                <span className={styles.packLabel}>{pkg.label || 'Coin pack'}</span>
                <strong>{total.toLocaleString('en-IN')} coins</strong>
                {pkg.bonusCoins > 0 && <span className={styles.bonus}>{pkg.coins.toLocaleString('en-IN')} coins + {pkg.bonusCoins.toLocaleString('en-IN')} bonus</span>}
                <span className={styles.price}>{rupees(pkg.priceInr)}</span>
              </button>
            </div>;
          })}
        </div>
      </section>
      <section className={`${styles.checkoutPanel} panel`} aria-labelledby="checkout-title">
        <div><p className="eyebrow">Ready when you are</p><h2 id="checkout-title">{selected ? `${totalCoins(selected).toLocaleString('en-IN')} coins for ${rupees(selected.priceInr)}` : 'Select a pack'}</h2><p>Razorpay handles the payment window. Pandit Talk confirms the payment on the server before changing your balance.</p></div>
        <button type="button" className="button" onClick={() => void startPayment()} disabled={!selected || busy} aria-busy={busy || undefined}>{stage === 'starting' ? 'Preparing secure checkout…' : stage === 'verifying' ? 'Confirming payment…' : selected ? `Pay ${rupees(selected.priceInr)} securely` : 'Select a pack'}</button>
      </section>
    </>}

    {(message || success) && <div ref={statusRef} tabIndex={-1} className={success ? 'notice' : stage === 'error' ? 'error' : 'notice'} role={stage === 'error' ? 'alert' : 'status'} aria-live="polite">
      {success ? <><strong>Coins added to your wallet.</strong><p>{success.coins.toLocaleString('en-IN')} coins were confirmed. Your new balance is {success.balance.toLocaleString('en-IN')} coins.</p></> : <><p>{message}</p>{stage !== 'starting' && <Link className="text-link" href={paymentReference ? `/wallet/payment-status?reference=${encodeURIComponent(paymentReference)}` : '/wallet/payment-status'}>Check payment status →</Link>}</>}
    </div>}

    <div className="panel stack">
      <h2>Before you pay</h2>
      <p>Review the total above. If you close the payment window or a payment fails, check your wallet and payment status before trying again. Successful recharges appear in wallet history.</p>
      <p className="expert-meta">Need help? <Link href="/help/coins-and-payment-pending">Read payment help</Link> or <Link href="/contact">contact support</Link>.</p>
    </div>
    <LinkKeyboardGroup className="actions" aria-label="Recharge next steps"><Link className="text-link" href="/wallet">Back to wallet →</Link><Link className="text-link" href="/refund-and-cancellation-policy">Refund policy →</Link><Link className="text-link" href="/pricing">Pricing terms →</Link></LinkKeyboardGroup>
  </main>;
}
