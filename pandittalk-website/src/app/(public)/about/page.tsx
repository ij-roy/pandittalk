import { organizationName } from '@/content/siteIdentity';
import Link from 'next/link';
import type { Metadata } from 'next';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { SiteIcon } from '@/components/site/SiteIcon';
import { InformationPage } from './InformationPage';

export const metadata: Metadata = {
  title: 'About Pandit Talk',
  description: 'Traditional wisdom, real Pandits and modern technology for thoughtful conversations with room to explain.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Pandit Talk',
    description: 'Traditional wisdom, real Pandits and modern technology for thoughtful conversations with room to explain.',
    url: '/about',
  },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="About Pandit Talk"
      title="Traditional wisdom, brought into a calmer room."
      intro="Pandit Talk brings practitioners, thoughtful technology and practical customer controls together for conversations that leave room to explain."
    >
      <section className="panel info-card">
        <p className="info-label">The belief behind our work</p>
        <h2>When you talk, you deserve to be heard.</h2>
        <p>We are building this service around that simple belief, with room for your questions and your choice of what comes next.</p>
        <p className="sr-only" id="about-approach-hint">Arrow keys move between approach links. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="About approach links" aria-describedby="about-approach-hint">
          <Link className="button" href="/our-approach">Our approach</Link>
          <Link className="button secondary" href="/how-it-works">How it works</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>

      <div className="info-columns">
        <section className="panel info-card">
          <p className="info-label">What you can do today</p>
          <h2>Explore, prepare, learn</h2>
          <ul>
            <li>Browse Pandit profiles written in their own words.</li>
            <li>Prepare a private conversation draft without creating a booking.</li>
            <li>Try labelled automated tools, separate from a live consultation.</li>
            <li>Read journal articles with named authors.</li>
          </ul>
        </section>
        <section className="panel info-card">
          <p className="info-label">What stays closed for now</p>
          <h2>New No Timer bookings</h2>
          <p>Website bookings for new No Timer conversations stay closed until pricing, completion and interruption terms are finalized. Existing bookings keep their agreed terms.</p>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Get a note when booking opens →</Link>
        </section>
      </div>

      <section className="panel info-card">
        <p className="info-label">Boundaries we keep visible</p>
        <h2>Guidance with clear limits</h2>
        <p>Spiritual guidance does not replace medical, legal or financial advice, and it does not guarantee an external outcome. Automated tools are labelled so they are never mistaken for a person.</p>
        <p className="sr-only" id="about-trust-hint">Arrow keys move between trust, policy, tools and draft links. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="About trust and policy links" aria-describedby="about-trust-hint">
          <Link className="text-link" href="/trust">Trust &amp; care →</Link>
          <Link className="text-link" href="/disclaimer">Disclaimer →</Link>
          <Link className="text-link" href="/editorial-policy">Editorial policy →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>

      <p className="sr-only" id="about-next-hint">Arrow keys move between About next steps. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
      <LinkKeyboardGroup className="actions" aria-label="About next steps" aria-describedby="about-next-hint">
        <Link className="button" href="/pandits">Explore Pandits</Link>
        <Link className="button secondary" href="/guidance">Find guidance</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="text-link" href="/for-pandits">For Pandits →</Link>
      </LinkKeyboardGroup>

      <aside className="notice offer-notice" aria-label="Get availability updates">
        <SiteIcon name="info" size={19} />
        <div className="offer-notice-body">
          <p><strong>Want a note when No Timer opens?</strong> Leave your email and we will write when website booking terms are ready.</p>
          <NotifyOpenForm source="website_about" />
        </div>
      </aside>

      <section className="panel info-card">
        <p className="info-label">Our organization</p>
        <p>Pandit Talk is a service operated by <strong>{organizationName}</strong>.</p>
        <p className="sr-only" id="about-org-hint">Arrow keys move between organization links. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="About organization next steps" aria-describedby="about-org-hint">
          <Link className="text-link" href="/contact">Contact our team →</Link>
          <Link className="text-link" href="/trust">Trust &amp; care →</Link>
          <Link className="text-link" href="/accessibility">Accessibility →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>
    </InformationPage>
  );
}
