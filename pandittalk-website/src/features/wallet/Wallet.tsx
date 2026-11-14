'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useApi } from '@/lib/api/client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { formatIstDateTime } from '@/lib/time/ist';
import styles from '../account/customer.module.css';

type Transaction = { id: string; type: string; coinsAmount: number; amountInr?: number | null; status?: string; createdAt: string };

function transactionStatusTone(status?: string) {
  const value = (status || '').toLowerCase();
  if (['success', 'paid', 'captured', 'completed', 'credited', 'refunded'].includes(value)) return 'ready' as const;
  if (['pending', 'processing', 'authorized'].includes(value)) return 'pending' as const;
  if (['failed', 'cancelled', 'canceled', 'declined'].includes(value)) return 'cancelled' as const;
  return null;
}

const statusBadgeClass = {
  pending: styles.badge_pending,
  ready: styles.badge_ready,
  live: styles.badge_live,
  done: styles.badge_done,
  cancelled: styles.badge_cancelled,
} as const;

export function Wallet() {
  const q = useApi<{ coinBalance: number; transactions: Transaction[] }>('/wallet');
  const errorRef = useRef<HTMLDivElement>(null);
  const zeroRef = useRef<HTMLElement>(null);
  const emptyTxRef = useRef<HTMLElement>(null);
  const sawZero = useRef(false);
  const sawEmptyTx = useRef(false);
  useEffect(() => {
    if (q.error) requestAnimationFrame(() => {
      const node = errorRef.current;
      if (!node) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      node.focus({ preventScroll: true });
    });
  }, [q.error]);
  useEffect(() => {
    if (!q.data || q.data.coinBalance !== 0) {
      sawZero.current = false;
      return;
    }
    if (sawZero.current) return;
    sawZero.current = true;
    requestAnimationFrame(() => {
      const node = zeroRef.current;
      if (!node) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      node.focus({ preventScroll: true });
    });
  }, [q.data]);
  useEffect(() => {
    if (!q.data || (q.data.transactions?.length ?? 0) > 0) {
      sawEmptyTx.current = false;
      return;
    }
    if (sawEmptyTx.current || q.data.coinBalance === 0) return;
    sawEmptyTx.current = true;
    requestAnimationFrame(() => {
      const node = emptyTxRef.current;
      if (!node) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      node.focus({ preventScroll: true });
    });
  }, [q.data]);
  return <main id="main-content" className="page stack" aria-busy={q.loading || undefined}>
    <div><p className="eyebrow">Your balance, in one place</p><h1>Wallet</h1><p className="lede">View your available coins, payments and refunds. New recharge stays paused — opening this page never starts a top-up or No Timer booking.</p></div>
    {q.loading && <>
      <p className="notice" role="status">Loading your wallet…</p>
      <p className="sr-only" id="wallet-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
      <LinkKeyboardGroup className="actions" aria-label="While wallet loads" aria-describedby="wallet-loading-hint">
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
      </LinkKeyboardGroup>
      <div className="panel stack" aria-hidden="true"><span className="skeleton-line short" /><span className="skeleton-line shorter" /><span className="skeleton-line" /></div>
    </>}
    {q.error && <div className="error" role="alert" tabIndex={-1} ref={errorRef} onKeyDown={event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      (event.currentTarget as HTMLElement).blur();
    }}><p>{q.error.message} Press Escape to leave this alert.</p><p className="sr-only" id="wallet-load-hint">Arrow keys move between wallet load recovery links. Escape blurs. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Wallet load recovery" aria-describedby="wallet-load-hint"><button type="button" className="button secondary" onClick={q.reload} disabled={q.loading} aria-busy={q.loading || undefined}>{q.loading ? 'Trying again…' : 'Try again'}</button><Link className="button secondary" href="/help/coins-and-payment-pending">Payment help</Link><Link className="button secondary" href="/tools">Try free tools</Link><Link className="button secondary" href="/guidance/start">Prepare a draft</Link><Link className="text-link" href="/contact">Contact support →</Link></LinkKeyboardGroup></div>}
    {q.data && <>
      <section className="panel" aria-label="Available wallet balance"><p className="eyebrow">Available balance</p><p className={styles.balance} aria-live="polite">{q.data.coinBalance.toLocaleString('en-IN')} <span>coins</span></p><p>Your balance is shared with your Pandit Talk app account. Pending payments are not included until they settle. An existing balance is not a top-up offer and does not unlock new No Timer bookings while they stay paused.</p></section>
      <div className="notice" role="status"><strong>Recharge is currently unavailable</strong><p>Your existing balance and transaction history are still available. <span className="sr-only" id="wallet-recharge-pause-hint">Arrow keys move between recharge pause, support, help, tools and draft. Escape blurs. Skip remains site-content.</span> <LinkKeyboardGroup as="span" aria-label="Wallet recharge pause links" aria-describedby="wallet-recharge-pause-hint"><Link href="/wallet/recharge">Why recharge is paused</Link> · <Link href="/contact">Contact support</Link> for payment or refund help · <Link href="/help">Help centre</Link> · <Link href="/tools">Try free tools</Link> · <Link href="/guidance/start">Prepare a draft</Link></LinkKeyboardGroup>.</p></div>
      {q.data.coinBalance === 0 && (
        <aside className="notice" role="status" tabIndex={-1} ref={zeroRef} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}>
          <p><strong>Your balance is zero.</strong> New top-ups are paused. You can still explore Pandits, prepare a draft, or leave your email for recharge updates. Press Escape to leave this notice.</p>
          <p className="sr-only" id="wallet-zero-hint">Arrow keys move between zero-balance next steps. Escape blurs the focused link.</p>
          <LinkKeyboardGroup className="actions" aria-label="Zero balance next steps" aria-describedby="wallet-zero-hint">
            <Link className="button secondary" href="/wallet/recharge">Get recharge updates</Link>
            <Link className="button secondary" href="/pandits">Explore Pandits</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </aside>
      )}
      <div className={styles.toolbar}>
        <h2>{q.data.transactions?.length ? 'Recent transactions' : 'Transactions'}</h2>
        <p className="sr-only" id="wallet-toolbar-hint">Arrow keys move between Refresh, payment, free-tools and draft shortcuts. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" style={{ margin: 0 }} aria-label="Wallet refresh" aria-describedby="wallet-toolbar-hint">
          <button type="button" className="button secondary" onClick={q.reload} disabled={q.loading} aria-busy={q.loading || undefined}>{q.loading ? 'Refreshing…' : 'Refresh wallet'}</button>
          <Link className="text-link" href="/wallet/payment-status">Payment status</Link>
          <Link className="text-link" href="/help/coins-and-payment-pending">Payment help</Link>
          <Link className="text-link" href="/tools">Free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft</Link>
        </LinkKeyboardGroup>
      </div>
      {q.data.transactions?.length ? <div className="stack" role="list" aria-label="Recent wallet transactions" aria-describedby="wallet-tx-hint" onKeyDown={event => {
        if (!(event.target instanceof HTMLElement)) return;
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[data-wallet-tx]'));
        const index = items.indexOf(event.target);
        if (index < 0) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          event.target.blur();
          return;
        }
        let next = index;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % items.length;
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else return;
        event.preventDefault();
        items[next]?.focus();
      }}>{q.data.transactions.map(t => {
        const tone = transactionStatusTone(t.status);
        const needsFollowUp = tone === 'pending' || tone === 'cancelled';
        const label = `${t.type.replaceAll('_', ' ')}, ${t.coinsAmount.toLocaleString('en-IN')} coins${t.status ? `, ${t.status.replaceAll('_', ' ')}` : ''}`;
        return <article className={`panel ${styles.transaction}`} key={t.id} role="listitem" aria-label={label}>
          <div><p><strong>{t.type.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase())}</strong></p><small><time dateTime={t.createdAt}>{formatIstDateTime(t.createdAt)}</time></small></div>
          <div>
            <p className={styles.transactionValue}>{t.coinsAmount.toLocaleString('en-IN')} coins{typeof t.amountInr === 'number' && t.amountInr > 0 ? ` · ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(t.amountInr)}` : ''}</p>
            {t.status && <span className={`${styles.badge}${tone ? ` ${statusBadgeClass[tone]}` : ''}`}>{t.status.replaceAll('_', ' ')}</span>}
            {tone === 'ready' && (
              <p className="expert-meta">Settled in wallet history — not a new recharge. Recharge stays paused.</p>
            )}
            {needsFollowUp ? (
              <>
                <p className="sr-only" id={`wallet-tx-${t.id}-hint`}>Arrow keys move between payment follow-up, free tools, draft and support for this transaction. Escape blurs. Skip remains site-content.</p>
                <LinkKeyboardGroup className="actions" style={{ marginTop: 8 }} aria-label={`Follow up on ${t.type.replaceAll('_', ' ')}`} aria-describedby={`wallet-tx-${t.id}-hint`}>
                  <Link
                    className="text-link"
                    data-wallet-tx
                    href={`/wallet/payment-status?reference=${encodeURIComponent(t.id)}${t.status ? `&status=${encodeURIComponent(t.status)}` : ''}`}
                  >
                    {tone === 'pending' ? 'Check payment status →' : 'Payment help →'}
                  </Link>
                  {tone === 'cancelled' && <Link className="text-link" data-wallet-tx href="/help/coins-and-payment-pending">Why a payment can fail →</Link>}
                  <Link className="text-link" data-wallet-tx href="/tools">Try free tools →</Link>
                  <Link className="text-link" data-wallet-tx href="/guidance/start">Prepare a draft →</Link>
                  <Link className="text-link" data-wallet-tx href="/contact">Contact support →</Link>
                </LinkKeyboardGroup>
              </>
            ) : (
              <p className="expert-meta" data-wallet-tx tabIndex={0}>{label}. Escape blurs this row.</p>
            )}
          </div>
        </article>;
      })}</div> : <section className={`panel stack ${styles.empty}`} role="status" tabIndex={-1} ref={emptyTxRef} onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }}>
        <h2>No transactions yet</h2>
        <p>
          {q.data.coinBalance === 0
            ? 'No payment or refund history yet. A zero balance does not open recharge — new top-ups stay paused while terms are verified. Press Escape to leave this notice.'
            : 'Coin payments and refunds will appear here when you use your wallet. Recharge stays paused; an existing balance is not a top-up offer. Press Escape to leave this notice.'}
        </p>
        <p className="sr-only" id="wallet-empty-hint">Arrow keys move between recharge pause, pricing, Pandits, free tools, draft and booking updates. Escape blurs the focused link. Skip remains site-content. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Empty wallet next steps" aria-describedby="wallet-empty-hint">
          <Link className="button secondary" href="/wallet/recharge">Why recharge is paused</Link>
          <Link className="button secondary" href="/pricing">Understand pricing</Link>
          <Link className="button secondary" href="/pandits">Explore Pandits</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Notify me when booking opens →</Link>
        </LinkKeyboardGroup>
      </section>}
      {q.data.transactions?.length ? <p className="sr-only" id="wallet-tx-hint">Arrow keys move between payment follow-up links and settled rows. Home and End jump to the first or last. Escape blurs the focused control.</p> : null}
      <p className="expert-meta" role="status" aria-live="polite">{q.loading ? 'Refreshing wallet…' : 'Balances and transactions reflect your shared app account. A payment-status link is guidance only until this page updates.'}</p>
    </>}
    <p className="sr-only" id="wallet-footer-hint">Arrow keys move between wallet shortcuts. Escape blurs the focused link. Skip remains site-content.</p>
    <LinkKeyboardGroup className="actions" aria-label="Wallet shortcuts" aria-describedby="wallet-footer-hint"><Link className="text-link" href="/bookings">View your bookings →</Link><Link className="text-link" href="/wallet/payment-status">Check a payment status →</Link><Link className="text-link" href="/tools">Try free tools →</Link><Link className="text-link" href="/guidance/start">Prepare a draft →</Link><Link className="text-link" href="/help/coins-and-payment-pending">Payment help →</Link></LinkKeyboardGroup>
  </main>;
}
