import { organizationName, privacyEmail, supportEmail } from '@/content/siteIdentity';
import Link from 'next/link';
import { InformationPage } from '../about/InformationPage';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { ContactQuickActions } from './ContactQuickActions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact support',
  description: 'Email Pandit Talk support for account, booking or payment questions.',
  alternates: { canonical: '/contact' },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="Pandit Talk support"
      title="A question? Start here."
      intro="Tell us what you need help with, and include your booking or payment reference when relevant. We aim to reply as soon as we can (often within a few working days). For a new consultation, choose a Pandit and use the live scheduled or Chat Now path on their profile."
    >
      <aside className="notice" role="status">
        <p>
          <strong>Looking to book?</strong> Choose a Pandit to see live scheduled times, Chat Now availability, duration and total before confirming.{' '}
          <LinkKeyboardGroup as="span" aria-label="Contact booking alternatives" aria-describedby="contact-booking-alt-hint">
            <Link href="/pandits">explore Pandits</Link>
            {' · '}
            <Link href="/tools">try free tools</Link>
            {' · '}
            <Link href="/guidance/start">prepare a draft</Link>
          </LinkKeyboardGroup>
          <span className="sr-only" id="contact-booking-alt-hint">Arrow keys move between Pandits, tools and optional notes. Escape blurs. Skip remains site-content.</span>
          .
        </p>
      </aside>
      <div className="info-columns">
        <section className="panel info-card">
          <p className="info-label">Write to our team</p>
          <h2>Contact support</h2>
          <p>
            Send a short description of your question to{' '}
            <a href={`mailto:${supportEmail}?subject=${encodeURIComponent('Pandit Talk support')}`}>
              {supportEmail}
              <span className="sr-only"> (opens your email app)</span>
            </a>
            . Include your booking ID or payment reference if you have one.
          </p>
          <ContactQuickActions />
          <p className="expert-meta" style={{ marginTop: 12 }}>
            Account locked out? <Link href="/help/account-access">Start with account access help</Link>.
          </p>
        </section>
        <section className="panel info-card">
          <p className="info-label">Find a practical next step</p>
          <h2>Browse the help centre</h2>
          <p>Find guidance on account access, payments, bookings and joining your conversation.</p>
          <p className="sr-only" id="contact-help-hint">Arrow keys move between help centre, tools and draft. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Contact help centre next steps" aria-describedby="contact-help-hint">
            <Link className="button secondary" href="/help">Visit the help centre</Link>
            <Link className="text-link" href="/help/account-access">Account access →</Link>
            <Link className="text-link" href="/help/coins-and-payment-pending">Payment help →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </section>
      </div>

      <section className="panel info-card">
        <h2>Choose the right inbox</h2>
        <p className="sr-only" id="contact-inbox-keys">Arrow keys move between inbox destinations. Escape blurs the focused link.</p>
        <LinkKeyboardGroup aria-label="Support inbox destinations" aria-describedby="contact-inbox-keys">
          <ul className="link-list">
            <li>
              Account, booking or payment questions →{' '}
              <a href={`mailto:${supportEmail}`}>
                {supportEmail}
                <span className="sr-only"> (opens your email app)</span>
              </a>
            </li>
            <li>
              Privacy or data rights →{' '}
              <a href={`mailto:${privacyEmail}?subject=${encodeURIComponent('Privacy request')}`}>
                {privacyEmail}
                <span className="sr-only"> (opens your email app)</span>
              </a>
            </li>
            <li>Formal grievances → <Link href="/grievance-redressal">grievance redressal</Link></li>
            <li>Accessibility barriers → <Link href="/accessibility">Accessibility</Link></li>
            <li>Booking availability → <Link href="/pandits">Explore Pandits</Link></li>
          </ul>
        </LinkKeyboardGroup>
      </section>

      <aside className="notice" role="status">Do not include sensitive birth, palm, or conversation details in your first email. Our support team will reply from an official <strong>@pandittalk.com</strong> address.</aside>
      <section className="panel info-card">
        <p className="info-label">Our organization</p>
        <p>Pandit Talk is operated by <strong>{organizationName}</strong>.</p>
      </section>
    </InformationPage>
  );
}
