import Link from 'next/link';
import { FocusOnHash } from '@/components/site/FocusOnHash';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { InformationPage } from '../about/InformationPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trust and care',
  description: 'What Pandit Talk asks of this service: respectful listening, honest claims, and care with what you share during timed conversations.',
  alternates: { canonical: '/trust' },
  openGraph: {
    title: 'Trust and care · Pandit Talk',
    description: 'Respectful listening, honest claims, and care with what you share during timed conversations.',
    url: '/trust',
  },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="Trust and care"
      title="What we ask of this service."
      intro="Respectful listening, room for uncertainty, and care with what you share. Here is what you can verify today."
    >
      <div className="info-columns">
        <section className="panel info-card">
          <p className="info-label">Today</p>
          <h2>What is already true</h2>
          <ul>
            <li>Pandit profiles show practitioner-provided introductions, languages and practice areas — not invented testimonials.</li>
            <li>App presence is a signal, not a guarantee; the booking flow rechecks live availability before Chat Now.</li>
            <li>Published reviews appear only when they pass our public eligibility checks.</li>
            <li>Scheduled and Chat Now bookings show the current duration, total and terms before confirmation.</li>
            <li>Browsing profiles and preparing an optional note never charges coins; the booking service charges only after confirmation.</li>
            <li>Automated tools are labelled separately from a live conversation.</li>
            <li>Spiritual guidance does not replace medical, legal or financial advice.</li>
          </ul>
        </section>
        <section className="panel info-card">
          <p className="info-label">Still being confirmed</p>
          <h2>What we will publish next</h2>
          <ul>
            <li>Verification evidence for practitioners.</li>
            <li>Named support ownership and response commitments.</li>
            <li>Clear service limitations for every paid conversation format.</li>
          </ul>
          <p>No popularity, credential, review or outcome claim is added without a source.</p>
        </section>
      </div>

      <FocusOnHash hash="#how-to-check" targetId="how-to-check" />
      <section className="panel info-card" id="how-to-check" tabIndex={-1}>
        <p className="info-label">How to check a claim</p>
        <h2>Look for the source, not the slogan</h2>
        <ul>
          <li>Profile text should read like an introduction from the practitioner — not a marketing blurb inventing results.</li>
          <li>Reviews should sit on a profile only when eligibility checks allow them to appear publicly.</li>
          <li>“Online” or app presence is only a signal; the Chat Now booking service makes the final availability decision.</li>
          <li>Tools and journal pieces should say whether a person or an automated process produced them.</li>
        </ul>
        <p className="sr-only" id="trust-check-hint">Arrow keys move between how-to-check links. Escape blurs the focused link.</p>
        <LinkKeyboardGroup className="actions" aria-label="Trust how-to-check next steps" aria-describedby="trust-check-hint">
          <Link className="text-link" href="/editorial-policy">Editorial labelling →</Link>
          <Link className="text-link" href="/disclaimer">Service disclaimer →</Link>
          <Link className="text-link" href="/accessibility">Accessibility →</Link>
        </LinkKeyboardGroup>
      </section>

      <section className="panel info-card">
        <h2>The standard we expect</h2>
        <p>Practitioners should listen respectfully, acknowledge uncertainty, protect confidentiality and accept reports of misconduct.</p>
        <p className="sr-only" id="trust-practitioner-hint">Arrow keys move between practitioner links. Escape blurs the focused link.</p>
        <LinkKeyboardGroup className="actions" aria-label="Trust practitioner links" aria-describedby="trust-practitioner-hint">
          <Link className="text-link" href="/for-pandits">How Pandits join →</Link>
          <Link className="text-link" href="/editorial-policy">Editorial policy →</Link>
        </LinkKeyboardGroup>
      </section>

      <div className="info-columns">
        <section className="panel info-card">
          <h2>Your information</h2>
          <p>Read how information is collected, used and protected, and learn about your account controls.</p>
          <p className="sr-only" id="trust-privacy-hint">Arrow keys move between privacy links. Escape blurs the focused link.</p>
          <LinkKeyboardGroup className="actions" aria-label="Trust privacy links" aria-describedby="trust-privacy-hint">
            <Link className="text-link" href="/privacy">Read the privacy policy →</Link>
            <Link className="text-link" href="/cookie-policy">Cookie policy →</Link>
            <Link className="text-link" href="/account/privacy">Signed-in privacy controls →</Link>
          </LinkKeyboardGroup>
        </section>
        <section className="panel info-card">
          <h2>Raise a concern</h2>
          <p>If something needs a closer look, contact our team with a short description and the relevant booking or payment reference. We aim to reply as soon as we can; formal grievances and refund paths stay separate from the booking flow.</p>
          <p className="sr-only" id="trust-concern-hint">Arrow keys move between contact, refunds help, grievance and refund policy. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
          <LinkKeyboardGroup className="actions" aria-label="Trust concern links" aria-describedby="trust-concern-hint">
            <Link className="text-link" href="/contact">Contact support →</Link>
            <Link className="text-link" href="/help/refunds-and-complaints">Refunds and complaints →</Link>
            <Link className="text-link" href="/grievance-redressal">Grievance redressal →</Link>
            <Link className="text-link" href="/refund-and-cancellation-policy">Refund policy →</Link>
          </LinkKeyboardGroup>
        </section>
      </div>

      <section className="panel info-card">
        <h2>What we will not claim without evidence</h2>
        <p>We do not invent testimonials, inflate ratings, or promise medical, legal or financial outcomes. App “online” presence is not treated as a booking guarantee.</p>
        <p className="sr-only" id="trust-evidence-hint">Arrow keys move between evidence boundary links. Escape blurs the focused link.</p>
        <LinkKeyboardGroup className="actions" aria-label="Trust evidence boundary links" aria-describedby="trust-evidence-hint">
          <Link className="text-link" href="/accessibility">Accessibility commitments →</Link>
          <Link className="text-link" href="/disclaimer">Disclaimer →</Link>
        </LinkKeyboardGroup>
      </section>

      <p className="sr-only" id="trust-next-hint">Arrow keys move between Trust next steps. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
      <LinkKeyboardGroup className="actions" aria-label="Trust next steps" aria-describedby="trust-next-hint">
        <Link className="button" href="/pandits">Explore Pandits</Link>
        <Link className="button secondary" href="/how-it-works">How conversations work</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
      </LinkKeyboardGroup>

    </InformationPage>
  );
}
