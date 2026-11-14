import Link from 'next/link';

import { FocusMainHeading } from '@/components/site/FocusMainHeading';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wallet recharge',
  description: 'Coin top-ups are paused on Pandit Talk. Nothing is charged from this page — check your wallet balance or get notified when recharge opens.',
  alternates: { canonical: '/wallet/recharge' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Wallet recharge · Pandit Talk',
    description: 'Coin top-ups are paused. Nothing is charged from this page.',
    url: '/wallet/recharge',
  },
};

export default function Page() {
  return (
    <main id="main-content" className="page stack">
      <FocusMainHeading id="recharge-title" />
      <Link className="text-link" href="/wallet">← Your wallet</Link>
      <p className="eyebrow">Coins and top-ups</p>
      <h1 id="recharge-title" tabIndex={-1}>Recharge is not open yet</h1>
      <p className="lede">New coin top-ups are paused while payment and No Timer service terms are finalized. Your existing balance and transaction history remain available.</p>
      <aside className="notice" role="status" aria-label="Recharge availability">
        <p><strong>Nothing will be charged from this page.</strong> There is no payment form here — leave your email if you want a note when recharge opens.</p>
        <p className="sr-only" id="recharge-notify-alt-hint">Arrow keys move between free tools and draft while you wait. Escape blurs. NotifyOpenForm still requires source. Skip remains site-content.</p>
        <p className="expert-meta">
          <LinkKeyboardGroup as="span" aria-label="While waiting for recharge updates" aria-describedby="recharge-notify-alt-hint">
            <Link href="/tools">Try free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </p>
        <NotifyOpenForm source="website_wallet_recharge" />
      </aside>
      <div className="panel stack">
        <h2>While recharge is paused</h2>
        <p className="sr-only" id="recharge-links-hint">Arrow keys move between recharge alternatives including free tools and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup as="nav" aria-label="While recharge is paused" aria-describedby="recharge-links-hint">
          <ul className="link-list">
            <li><Link href="/wallet">Check your current coin balance</Link></li>
            <li><Link href="/wallet/payment-status">Look up a previous payment status</Link></li>
            <li><Link href="/guidance/start">Prepare a conversation draft</Link></li>
            <li><Link href="/tools">Try free astrology tools</Link></li>
            <li><Link href="/pricing">Read pricing and service terms</Link></li>
            <li><Link href="/pricing-policy">Formal pricing policy</Link></li>
            <li><Link href="/refund-and-cancellation-policy">Refunds and cancellations</Link></li>
            <li><Link href="/help/coins-and-payment-pending">Payment and coin help</Link></li>
            <li><Link href="/how-it-works#booking-availability-how">Join the No Timer booking list (separate)</Link></li>
          </ul>
        </LinkKeyboardGroup>
        <p className="expert-meta">
          The email form above is for wallet recharge only — not No Timer booking.
        </p>
      </div>
      <p className="sr-only" id="recharge-footer-hint">Arrow keys move between wallet, help, free tools and draft. Escape blurs. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Wallet recharge next steps" aria-describedby="recharge-footer-hint">
        <Link className="button secondary" href="/wallet">View wallet balance</Link>
        <Link className="button secondary" href="/help/coins-and-payment-pending">Payment help</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="text-link" href="/contact">Contact support →</Link>
      </LinkKeyboardGroup>
    </main>
  );
}
