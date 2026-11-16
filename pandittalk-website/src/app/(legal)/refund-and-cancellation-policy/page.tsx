import Link from 'next/link';
import { InformationPage } from '../../(public)/about/InformationPage';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refunds and cancellation',
  description: 'Refund and cancellation terms for Pandit Talk bookings and coin purchases.',
  alternates: { canonical: '/refund-and-cancellation-policy' },
  openGraph: { title: 'Refunds and cancellation · Pandit Talk', description: 'Terms for bookings and purchases.', url: '/refund-and-cancellation-policy' },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="Policy review required"
      title="Refunds and cancellation"
      intro="Eligibility depends on the persisted payment, booking, connection and report state. The booking service applies the terms shown for the session you confirm; existing bookings retain their original terms."
    >
      <section className="panel info-card">
        <h2>What stays true today</h2>
        <ul>
          <li>Existing bookings keep the terms agreed when they were made.</li>
          <li>New timed bookings use the duration, total, cancellation and refund terms shown before confirmation.</li>
          <li>Support reviews recorded payment and booking status before deciding on a refund path.</li>
        </ul>
      </section>
      <aside className="notice" role="status">
        No refund promise is made by this preview page. Contact support with the opaque payment or booking reference for a recorded decision.
        {' '}
        <span className="sr-only" id="refund-pause-hint">Arrow keys move between Pandits and contact. Escape blurs. Skip remains site-content.</span>
        <LinkKeyboardGroup as="span" aria-label="Refund next steps" aria-describedby="refund-pause-hint">
          <Link href="/pandits">Choose a Pandit and review terms →</Link>
          {' · '}
          <Link href="/contact">Contact support →</Link>
        </LinkKeyboardGroup>
      </aside>
      <section className="panel info-card">
        <h2>Useful places for booking and payment questions</h2>
        <p className="sr-only" id="refund-places-hint">Arrow keys move between wallet, booking, pricing, optional notes and free tools. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup as="nav" aria-label="Refund useful places" aria-describedby="refund-places-hint">
          <ul className="link-list">
            <li><Link href="/wallet">Check wallet balance and history</Link> (sign-in required)</li>
            <li><Link href="/wallet/payment-status">Look up a previous payment attempt</Link></li>
            <li><Link href="/bookings">Open an existing booking</Link></li>
            <li><Link href="/pricing">Customer pricing notes</Link></li>
            <li><Link href="/guidance/start">Prepare a private draft</Link></li>
            <li><Link href="/tools">Try free tools</Link></li>
          </ul>
        </LinkKeyboardGroup>
      </section>
      <p className="sr-only" id="refund-next-hint">Arrow keys move between refund policy next steps. Escape blurs. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Refund policy next steps" aria-describedby="refund-next-hint">
        <Link className="button" href="/help/refunds-and-complaints">Refunds help guide</Link>
        <Link className="button secondary" href="/contact">Contact support</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="text-link" href="/grievance-redressal">Formal grievance →</Link>
      </LinkKeyboardGroup>
    </InformationPage>
  );
}
