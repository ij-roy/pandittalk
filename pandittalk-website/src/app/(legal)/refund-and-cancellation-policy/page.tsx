import Link from 'next/link';
import { InformationPage } from '../../(public)/about/InformationPage';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refunds and cancellation',
  description: 'Refund and cancellation terms for existing Pandit Talk bookings and coin purchases. New No Timer bookings and new paid purchases stay paused on the website.',
  alternates: { canonical: '/refund-and-cancellation-policy' },
  openGraph: { title: 'Refunds and cancellation · Pandit Talk', description: 'Terms for existing bookings and purchases. New website bookings and paid unlocks stay paused.', url: '/refund-and-cancellation-policy' },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="Policy review required"
      title="Refunds and cancellation"
      intro="Eligibility depends on the persisted payment, booking, connection and report state. New No Timer bookings and new paid purchases stay closed on the website — this policy does not open a purchase path."
    >
      <section className="panel info-card">
        <h2>What stays true today</h2>
        <ul>
          <li>Existing bookings keep the terms agreed when they were made.</li>
          <li>New No Timer bookings and new paid purchases remain closed until terms are finalized.</li>
          <li>Support reviews recorded payment and booking status before deciding on a refund path.</li>
        </ul>
      </section>
      <aside className="notice" role="status">
        No refund promise is made by this preview page. Contact support with the opaque payment or booking reference for a recorded decision.
        {' '}
        <span className="sr-only" id="refund-pause-hint">Arrow keys move between booking updates and contact. Escape blurs. NotifyOpenForm still requires source. Skip remains site-content.</span>
        <LinkKeyboardGroup as="span" aria-label="Refund pause next steps" aria-describedby="refund-pause-hint">
          <Link href="/how-it-works#booking-availability-how">New bookings stay paused — get updates →</Link>
          {' · '}
          <Link href="/contact">Contact support →</Link>
        </LinkKeyboardGroup>
      </aside>
      <aside className="notice offer-notice" aria-label="Booking availability">
        <p>
          <strong>Want a note when No Timer opens?</strong> Refund questions stay separate — this list is only for booking availability.{' '}
          <span className="sr-only" id="refund-notify-hint">Arrow keys move between free tools and draft while you wait. Escape blurs. NotifyOpenForm still requires source. Skip remains site-content.</span>
          <LinkKeyboardGroup as="span" aria-label="Refund notify alternatives" aria-describedby="refund-notify-hint">
            <Link href="/tools">Try free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </p>
        <NotifyOpenForm source="website_refund_policy" helpText="Booking-open emails only — separate from refund replies. See our" />
      </aside>
      <section className="panel info-card">
        <h2>Useful places while purchases stay paused</h2>
        <p className="sr-only" id="refund-places-hint">Arrow keys move between paused-purchase destinations. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
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
