import Link from 'next/link';
import type { Metadata } from 'next';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { InformationPage } from '../../(public)/about/InformationPage';

export const metadata: Metadata = {
  title: 'Pricing policy',
  description: 'How Pandit Talk derives coin pricing and what you see before confirming a timed booking.',
  alternates: { canonical: '/pricing-policy' },
  openGraph: {
    title: 'Pricing policy · Pandit Talk',
    description: 'See how coin pricing and booking totals are presented before confirmation.',
    url: '/pricing-policy',
  },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="Pricing policy"
      title="Coins, INR and service scope"
      intro="For timed bookings, package IDs, durations, formats, coin totals and availability come from the booking service — not duplicated marketing copy. The exact total is shown before you confirm."
    >
      <section className="panel info-card">
        <h2>Current status</h2>
        <p>Scheduled sessions and Chat Now use the same backend quote and wallet rules as the app. The website does not invent a price or simulate a booking.</p>
        <p>Existing bookings keep the terms agreed at the time of booking. Refund and cancellation questions follow the published refund policy and your booking reference.</p>
        <p className="sr-only" id="pricing-policy-related-hint">Arrow keys move between pricing, refunds, booking flow, wallet, tools and optional notes. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup as="nav" aria-label="Pricing policy related links" aria-describedby="pricing-policy-related-hint">
          <ul className="link-list">
            <li><Link href="/pricing">Customer-facing pricing notes</Link></li>
            <li><Link href="/refund-and-cancellation-policy">Refund and cancellation policy</Link></li>
            <li><Link href="/how-it-works">How conversations and coins work</Link></li>
            <li><Link href="/pandits">Open the booking flow</Link></li>
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
        <p className="expert-meta">These checks apply before every timed booking confirmation.</p>
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
          <li>Prices or availability outside the live booking service</li>
          <li>Guaranteed outcomes tied to a coin amount</li>
          <li>Wallet balances or entitlements without a signed-in account</li>
        </ul>
      </section>

    </InformationPage>
  );
}
