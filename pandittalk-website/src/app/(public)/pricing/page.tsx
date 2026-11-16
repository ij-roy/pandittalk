import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import Link from 'next/link';
import { InformationPage } from '../about/InformationPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing and booking totals',
  description: 'See how Pandit Talk shows the live duration and total before a scheduled or Chat Now booking is confirmed.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing and booking totals · Pandit Talk',
    description: 'See how the booking service shows current duration and total before confirmation.',
    url: '/pricing',
  },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="Understand the commitment"
      title="See the total before you confirm."
      intro="Coins and INR are separate units. For each Pandit, the booking service supplies the current duration, format, availability and total before you confirm."
    >
      <section className="panel info-card">
        <p className="info-label">Live prices</p>
        <h2>The booking step is the source of truth.</h2>
        <p>Open a Pandit profile and choose a scheduled session or Chat Now. The website requests the current quote from the same booking service as the app and shows the duration and total before confirmation.</p>
        <p className="expert-meta">Do not rely on a copied price from this page. If availability or price changes, the service quote wins.</p>
      </section>
      <div className="info-columns">
        <section className="panel info-card">
          <p className="info-label">Current availability</p>
          <h2>Payments and your wallet</h2>
          <p>Wallet top-ups are separate from consultation booking. Add coins securely, then use the confirmed balance for eligible bookings. Your history and booking refunds stay in the same wallet.</p>
          <p className="sr-only" id="pricing-wallet-hint">Arrow keys move between wallet, recharge and pricing-policy links. Escape blurs. OfferNotice/NotifyOpenForm still require source.</p>
          <LinkKeyboardGroup className="actions" aria-label="Pricing wallet next steps" aria-describedby="pricing-wallet-hint">
            <Link className="button secondary" href="/login?returnTo=%2Fwallet&reason=auth">Sign in to view your wallet</Link>
            <Link className="text-link" href="/wallet/recharge">Wallet and recharge →</Link>
            <Link className="text-link" href="/pricing-policy">Pricing policy →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </section>
        <section className="panel info-card">
          <p className="info-label">An existing commitment</p>
          <h2>Your booking keeps its terms.</h2>
          <p>Bookings made under an earlier offer keep their agreed terms, including any time limit. Check your booking details for the terms that apply to you.</p>
          <p className="sr-only" id="pricing-bookings-hint">Arrow keys move between bookings, updates and payment-help links. Escape blurs the focused link.</p>
          <LinkKeyboardGroup className="actions" aria-label="Pricing bookings next steps" aria-describedby="pricing-bookings-hint">
            <Link className="button secondary" href="/login?returnTo=%2Fbookings&reason=auth">Sign in to view your bookings</Link>
            <Link className="text-link" href="/pandits">Choose a Pandit →</Link>
            <Link className="text-link" href="/help/coins-and-payment-pending">Payment help →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </section>
      </div>
      <section className="panel info-card">
        <h2>What you will see before you pay</h2>
        <ul>
          <li>The Pandit and conversation format</li>
          <li>The total in coins and INR, including taxes where applicable</li>
          <li>What is included, and what happens if the conversation is interrupted</li>
        </ul>
        <p className="expert-meta">Those details appear on the booking confirmation step. Formal cancellation and refund rules live in the <Link href="/pricing-policy">pricing policy</Link>.</p>
      </section>
      <section className="panel info-card">
        <h2>A payment question?</h2>
        <p>If a payment is pending, check its status before trying again. Keep your payment reference if you need support.</p>
        <p className="sr-only" id="pricing-help-hint">Arrow keys move between payment help, draft, tools and support. Escape blurs the focused link.</p>
        <LinkKeyboardGroup className="actions" aria-label="Pricing payment help" aria-describedby="pricing-help-hint">
          <Link className="button secondary" href="/help/coins-and-payment-pending">Get help with a payment</Link>
          <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/contact">Contact support →</Link>
        </LinkKeyboardGroup>
      </section>
    </InformationPage>
  );
}
