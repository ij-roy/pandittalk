import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { OfferNotice } from '@/components/site/OfferNotice';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { SiteIcon } from '@/components/site/SiteIcon';
import Link from 'next/link';
import { InformationPage } from '../about/InformationPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing when payments open',
  description: 'New website payments and No Timer bookings are paused. Understand coins, INR and what you will see before you pay once terms are ready.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing when payments open · Pandit Talk',
    description: 'New website payments are paused. See what confirmation will show before you pay once No Timer terms are ready.',
    url: '/pricing',
  },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="Understand the commitment"
      title="What you will see before you pay — when payments open."
      intro="Coins and INR are separate units. New website payments and No Timer bookings are paused. When they open, confirmation will list package price, any bonus, taxes and included services before you pay."
    >
      <OfferNotice compact hideSelfPricingLink source="website_pricing_offer" />
      <section className="panel info-card">
        <p className="info-label">Live prices</p>
        <h2>No live coin or INR prices on the website yet.</h2>
        <p>We will not show package figures here until No Timer booking and recharge terms are finalized. Confirmation will list the Pandit, format, total coins, INR and interruption terms before any payment.</p>
        <p className="expert-meta">The Android app may still sell timed Chat Now or Book Session packages under earlier terms. Those prices and durations apply only inside the app, not as a website No Timer offer.</p>
      </section>
      <div className="info-columns">
        <section className="panel info-card">
          <p className="info-label">Current availability</p>
          <h2>Payments and your wallet</h2>
          <p>New top-ups and consultation purchases are not yet available on this website. Payment and service terms are being verified before these options open.</p>
          <p>You can sign in now to view existing wallet history — that never starts a top-up. Recharge stays paused until terms are ready.</p>
          <p className="sr-only" id="pricing-wallet-hint">Arrow keys move between wallet, recharge and pricing-policy links. Escape blurs. OfferNotice/NotifyOpenForm still require source.</p>
          <LinkKeyboardGroup className="actions" aria-label="Pricing wallet next steps" aria-describedby="pricing-wallet-hint">
            <Link className="button secondary" href="/login?returnTo=%2Fwallet&reason=auth">Sign in to view your wallet</Link>
            <Link className="text-link" href="/wallet/recharge">Recharge updates →</Link>
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
            <Link className="text-link" href="/how-it-works#booking-availability-how">Get booking updates →</Link>
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
        <p className="expert-meta">Those details will appear on the confirmation step once No Timer booking opens. Formal pricing rules live in the <Link href="/pricing-policy">pricing policy</Link>.</p>
      </section>
      <aside className="notice offer-notice" aria-label="Get pricing updates">
        <SiteIcon name="info" size={19} />
        <div className="offer-notice-body">
          <p>
            <strong>Want a note when bookings and recharge open?</strong> Leave your email and we will write when pricing goes live.{' '}
            <span className="sr-only" id="pricing-notify-hint">Arrow keys move between free tools and draft while you wait. Escape blurs. NotifyOpenForm still requires source. Skip remains site-content.</span>
            <LinkKeyboardGroup as="span" aria-label="Pricing notify alternatives" aria-describedby="pricing-notify-hint">
              <Link href="/tools">Try free tools</Link>
              {' · '}
              <Link href="/guidance/start">Prepare a draft</Link>
            </LinkKeyboardGroup>
          </p>
          <NotifyOpenForm source="website_pricing" />
        </div>
      </aside>
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
