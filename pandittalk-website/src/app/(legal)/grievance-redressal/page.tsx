import Link from 'next/link';
import { InformationPage } from '../../(public)/about/InformationPage';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { grievanceEmail, supportEmail } from '@/content/siteIdentity';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grievance redressal',
  description: 'How to raise a formal grievance with Pandit Talk and what happens next.',
  alternates: { canonical: '/grievance-redressal' },
  openGraph: { title: 'Grievance redressal · Pandit Talk', description: 'How to raise a formal grievance with Pandit Talk and what happens next.', url: '/grievance-redressal' },
};

export default function Page() {
  const grievanceMailto = `mailto:${grievanceEmail}?subject=${encodeURIComponent('Formal grievance')}&body=${encodeURIComponent('Booking or payment reference:\n\nWhat happened and when:\n\nNote: New No Timer bookings are not open yet — use this for an existing booking, payment, or account concern.\n\nPage: /grievance-redressal\n')}`;
  const supportMailto = `mailto:${supportEmail}?subject=${encodeURIComponent('Everyday support')}&body=${encodeURIComponent('Booking or payment reference (if any):\n\nWhat happened:\n\nNote: New No Timer bookings are not open yet.\n\nPage: /grievance-redressal\n')}`;

  return (
    <InformationPage
      eyebrow="Grievance redressal"
      title="An accountable place to raise a concern."
      intro="If something needs a formal review, send a short description with your booking or payment reference."
    >
      <aside className="notice" role="status">
        <p>
          <strong>New No Timer bookings stay paused.</strong> Use this path for an existing booking, payment, privacy, or account concern — not to request a new consultation.
          {' '}<span className="sr-only" id="grievance-pause-hint">Arrow keys move between booking updates and everyday contact. Escape blurs. NotifyOpenForm still requires source.</span><LinkKeyboardGroup as="span" aria-label="Grievance pause next steps" aria-describedby="grievance-pause-hint"><Link href="/how-it-works#booking-availability-how">Get a note when booking opens</Link>
          {' · '}<Link href="/contact">Everyday contact</Link>
          {' · '}<Link href="/tools">Try free tools</Link></LinkKeyboardGroup>
        </p>
        <NotifyOpenForm source="website_grievance" helpText="Booking-open emails only — separate from grievance replies. See our" />
      </aside>
      <section className="panel info-card">
        <h2>How to raise a grievance</h2>
        <ol>
          <li>Gather the booking or payment reference.</li>
          <li>Write a short description of what happened and when.</li>
          <li>Email <a href={grievanceMailto}>{grievanceEmail}<span className="sr-only"> (opens your email app)</span></a>.</li>
          <li>Keep private conversation text out of the first message unless asked.</li>
        </ol>
        <p className="expert-meta">We acknowledge formal grievances by email at <a href={grievanceMailto}>{grievanceEmail}<span className="sr-only"> (opens your email app)</span></a>. Until a named officer and SLA are published, this mailbox is the formal channel — include your booking or payment reference so we can route the review.</p>
        <p className="sr-only" id="grievance-contact-hint">Arrow keys move between grievance email, support, tools and draft. Escape blurs. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Grievance contact actions" aria-describedby="grievance-contact-hint">
          <a className="button" href={grievanceMailto}>Email grievance desk <span aria-hidden="true">↗</span><span className="sr-only"> (opens your email app)</span></a>
          <a className="button secondary" href={supportMailto}>Everyday support · {supportEmail}<span className="sr-only"> (opens your email app)</span></a>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>
      <div className="info-columns">
        <section className="panel info-card">
          <h2>Everyday support</h2>
          <p>For account or payment questions that are not formal grievances, write to <a href={supportMailto}>{supportEmail}<span className="sr-only"> (opens your email app)</span></a> or use the contact form.</p>
          <p className="sr-only" id="grievance-everyday-hint">Arrow keys move between support email and contact form. Escape blurs the focused control.</p>
          <LinkKeyboardGroup className="actions" aria-label="Grievance everyday support" aria-describedby="grievance-everyday-hint">
            <a className="button secondary" href={supportMailto}>Email support<span className="sr-only"> (opens your email app)</span></a>
            <Link className="text-link" href="/contact">Contact form →</Link>
          </LinkKeyboardGroup>
        </section>
        <section className="panel info-card">
          <h2>Related policies</h2>
          <p>Review refunds, privacy and terms while your concern is being assessed.</p>
          <p className="sr-only" id="grievance-policies-hint">Arrow keys move between related policy links. Escape blurs the focused link.</p>
          <LinkKeyboardGroup className="actions" aria-label="Grievance related policies" aria-describedby="grievance-policies-hint">
            <Link className="text-link" href="/refund-and-cancellation-policy">Refunds &amp; cancellation →</Link>
            <Link className="text-link" href="/privacy">Privacy policy →</Link>
            <Link className="text-link" href="/terms-and-conditions">Terms &amp; conditions →</Link>
            <Link className="text-link" href="/account/privacy">Signed-in privacy controls →</Link>
          </LinkKeyboardGroup>
        </section>
      </div>
    </InformationPage>
  );
}
