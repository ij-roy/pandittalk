import Link from 'next/link';

import { FocusMainHeading } from '@/components/site/FocusMainHeading';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wallet recharge',
  description: 'Coin top-ups are not available on this page. Nothing is charged here — check your wallet balance or payment history.',
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
      <h1 id="recharge-title" tabIndex={-1}>Recharge is unavailable here</h1>
      <p className="lede">There is no payment form on the website yet. Your existing balance and transaction history remain available.</p>
      <aside className="notice" role="status" aria-label="Recharge availability">
        <p><strong>Nothing will be charged from this page.</strong> There is no payment form here. Use your existing wallet balance for eligible bookings or check a previous payment below.</p>
        <p className="sr-only" id="recharge-notify-alt-hint">Arrow keys move between free tools and draft. Escape blurs. Skip remains site-content.</p>
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
        <h2>Manage your wallet</h2>
        <p className="sr-only" id="recharge-links-hint">Arrow keys move between wallet, payment, free tools and draft links. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup as="nav" aria-label="Manage your wallet" aria-describedby="recharge-links-hint">
          <ul className="link-list">
            <li><Link href="/wallet">Check your current coin balance</Link></li>
            <li><Link href="/wallet/payment-status">Look up a previous payment status</Link></li>
            <li><Link href="/guidance/start">Prepare a conversation draft</Link></li>
            <li><Link href="/tools">Try free astrology tools</Link></li>
            <li><Link href="/pricing">Read pricing and service terms</Link></li>
            <li><Link href="/pricing-policy">Formal pricing policy</Link></li>
            <li><Link href="/refund-and-cancellation-policy">Refunds and cancellations</Link></li>
            <li><Link href="/help/coins-and-payment-pending">Payment and coin help</Link></li>
            <li><Link href="/pandits">View Pandits and live booking options</Link></li>
          </ul>
        </LinkKeyboardGroup>
        <p className="expert-meta">
          The email form above is for wallet recharge only. Booking availability is shown on each Pandit profile.
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
