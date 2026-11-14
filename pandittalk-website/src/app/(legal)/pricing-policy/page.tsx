import Link from 'next/link';
import type { Metadata } from 'next';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { InformationPage } from '../../(public)/about/InformationPage';

export const metadata: Metadata = {
  title: 'Pricing policy',
  description: 'Website purchases are paused. How Pandit Talk will describe coin pricing and what you will see before you pay once terms are ready.',
  alternates: { canonical: '/pricing-policy' },
  openGraph: {
    title: 'Pricing policy · Pandit Talk',
    description: 'Website purchases are paused. See how coin pricing will be described once No Timer terms are ready — nothing to pay here now.',
    url: '/pricing-policy',
  },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="Pricing policy"
      title="Coins, INR and service scope"
      intro="Purchases are paused on the website — there is nothing to pay here now. When enabled, package IDs, INR amounts, coin balances, bonus treatment, taxes and entitlements come from the service backend — not guessed by marketing copy."
    >
      <section className="panel info-card">
        <h2>Current status</h2>
        <p>New consultation pricing and website recharge stay disabled until product and operations approve the No Timer scope, completion, interruption, fair-use and capacity rules.</p>
        <p>Existing bookings keep the terms agreed at the time of booking. Refund and cancellation questions follow the published refund policy and your booking reference.</p>
        <p className="sr-only" id="pricing-policy-related-hint">Arrow keys move between pricing-policy related links including free tools and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup as="nav" aria-label="Pricing policy related links" aria-describedby="pricing-policy-related-hint">
          <ul className="link-list">
            <li><Link href="/pricing">Customer-facing pricing notes</Link></li>
            <li><Link href="/refund-and-cancellation-policy">Refund and cancellation policy</Link></li>
            <li><Link href="/how-it-works">How conversations and coins work</Link></li>
            <li><Link href="/how-it-works#booking-availability-how">Get a note when booking opens</Link></li>
            <li><Link href="/wallet">Your wallet (sign-in required)</Link></li>
            <li><Link href="/terms-and-conditions">Terms &amp; Conditions</Link></li>
            <li><Link href="/help/coins-and-payment-pending">Coins and pending payments help</Link></li>
            <li><Link href="/tools">Try free tools</Link></li>
            <li><Link href="/guidance/start">Prepare a draft</Link></li>
          </ul>
        </LinkKeyboardGroup>
      </section>

      <section className="panel info-card">
        <h2>What you should expect before paying</h2>
        <p className="expert-meta">These checks apply when purchases reopen — not while the website purchase path stays paused.</p>
        <ul>
          <li>A clear total in coins and INR</li>
          <li>What the conversation or report includes</li>
          <li>How interruptions, completion and cancellation are handled</li>
        </ul>
      </section>

      <section className="panel info-card">
        <h2>Coins and INR</h2>
        <p>Coins are the unit used inside Pandit Talk for conversations and eligible reports. INR is what you pay when you recharge. The website does not invent package prices: amounts and entitlements come from the live service configuration when purchases are enabled.</p>
        <p>Bonus coins, taxes and expiry rules — when they apply — are shown in the purchase or wallet flow, not inferred from marketing copy.</p>
      </section>

      <section className="panel info-card">
        <h2>What this page will not invent</h2>
        <ul>
          <li>Live package tables while purchases are paused</li>
          <li>Guaranteed outcomes tied to a coin amount</li>
          <li>Wallet balances or entitlements without a signed-in account</li>
        </ul>
      </section>

      <aside className="notice offer-notice" aria-label="Get pricing updates">
        <div className="offer-notice-body">
          <p><strong>Want a note when pricing and booking open?</strong> Leave your email — this list is for availability, not a charge.</p>
          <NotifyOpenForm source="website_pricing_policy" />
        </div>
      </aside>
    </InformationPage>
  );
}
