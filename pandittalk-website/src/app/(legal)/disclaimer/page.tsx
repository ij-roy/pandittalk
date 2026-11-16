import Link from 'next/link';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { InformationPage } from '../../(public)/about/InformationPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Pandit Talk provides traditional and spiritual guidance for reflection — not medical, legal or financial advice, and not a guarantee of outcomes.',
  alternates: { canonical: '/disclaimer' },
  openGraph: { title: 'Disclaimer · Pandit Talk', description: 'Pandit Talk provides traditional and spiritual guidance for reflection — not medical, legal or financial advice, and not a guarantee of outcomes.', url: '/disclaimer' },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="A clear boundary"
      title="Guidance is not a guarantee."
      intro="Pandit Talk provides traditional and spiritual guidance for reflection and preparation."
    >
      <section className="panel info-card">
        <h2>What this service is</h2>
        <ul>
          <li>A place for conversations with real Pandits and labelled automated tools.</li>
          <li>Support for clarifying a question and choosing a next step.</li>
          <li>Spiritual guidance only — not a substitute for regulated professional advice.</li>
        </ul>
      </section>
      <section className="panel info-card">
        <h2>What this service is not</h2>
        <ul>
          <li>Medical, legal or financial advice, diagnosis or treatment.</li>
          <li>A promise of any life outcome, prediction certainty or guaranteed result.</li>
          <li>A human consultation when the experience is labelled as an automated tool.</li>
        </ul>
      </section>
      <p className="notice" role="status">
        If you need medical, legal or financial help, please contact a qualified professional.{' '}
        <LinkKeyboardGroup as="span" aria-label="Disclaimer trust links" aria-describedby="disclaimer-trust-hint">
          <Link href="/trust">Read our trust commitments</Link>
          {' · '}
          <Link href="/editorial-policy">Editorial policy</Link>
          {' · '}
          <Link href="/contact">Contact support</Link>
        </LinkKeyboardGroup>
        <span className="sr-only" id="disclaimer-trust-hint">Arrow keys move between trust, editorial and contact. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</span>
        .
      </p>
      <p className="sr-only" id="disclaimer-next-hint">Arrow keys move between disclaimer next steps. Escape blurs the focused link. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Disclaimer next steps" aria-describedby="disclaimer-next-hint">
        <Link className="button secondary" href="/trust">Trust and care</Link>
        <Link className="button secondary" href="/editorial-policy">Editorial policy</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/how-it-works#booking-availability-how">Booking availability →</Link>
        <Link className="text-link" href="/contact">Contact support →</Link>
      </LinkKeyboardGroup>
      <aside className="notice offer-notice" aria-label="Get availability updates">
        <div className="offer-notice-body">
          <p>
            <strong>Ready to explore a conversation?</strong> Exploring tools and profiles does not create a booking or charge.{' '}
            <span className="sr-only" id="disclaimer-notify-hint">Arrow keys move between Pandits, tools and optional notes. Escape blurs. Skip remains site-content.</span>
            <LinkKeyboardGroup as="span" aria-label="Disclaimer booking alternatives" aria-describedby="disclaimer-notify-hint">
              <Link href="/pandits">Choose a Pandit</Link>
              {' · '}
              <Link href="/tools">Try free tools</Link>
              {' · '}
              <Link href="/guidance/start">Prepare a draft</Link>
            </LinkKeyboardGroup>
          </p>
          <NotifyOpenForm source="website_disclaimer" />
        </div>
      </aside>
    </InformationPage>
  );
}
