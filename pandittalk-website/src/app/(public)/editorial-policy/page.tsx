import Link from 'next/link';
import { supportEmail } from '@/content/siteIdentity';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { SiteIcon } from '@/components/site/SiteIcon';
import { InformationPage } from '../about/InformationPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editorial policy',
  description: 'How Pandit Talk attributes authorship, labels automated content, and handles corrections.',
  alternates: { canonical: '/editorial-policy' },
};

export default function Page() {
  const correctionMailto = `mailto:${supportEmail}?subject=${encodeURIComponent('Editorial correction request')}&body=${encodeURIComponent('Article URL:\nWhat needs review:\n')}`;
  return (
    <InformationPage
      eyebrow="Editorial policy"
      title="Useful reading, attributed clearly."
      intro="Context matters, including who wrote something and when it was published."
    >
      <section className="panel info-card">
        <h2>Authorship and context</h2>
        <p>Articles show their author and publication date. Image credits and corrections are handled through support when reported. Automated interpretations are labelled as automated. We do not turn private generated results into public editorial pages.</p>
      </section>
      <section className="panel info-card">
        <h2>What is labelled automated</h2>
        <p>
          Free tools such as Kundli, horoscope, compatibility, palm reading and tarot are automated and marked separately from a live Pandit conversation.
          A journal article is written content with a named author — not a private tool result republished as editorial.
        </p>
        <p className="sr-only" id="editorial-label-hint">Arrow keys move between labelling links. Escape blurs the focused link. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Editorial labelling links" aria-describedby="editorial-label-hint">
          <Link className="text-link" href="/tools">Browse tools →</Link>
          <Link className="text-link" href="/disclaimer">Service disclaimer →</Link>
          <Link className="text-link" href="/trust#how-to-check">How to check a claim →</Link>
        </LinkKeyboardGroup>
      </section>
      <div className="info-columns">
        <section className="panel info-card">
          <h2>Explore the journal</h2>
          <p>Read perspectives on festivals, home, work and the questions people bring to a Pandit. Empty categories mean nothing is published there yet — not a broken filter.</p>
          <p className="sr-only" id="editorial-journal-hint">Arrow keys move between journal and tools links. Escape blurs the focused link.</p>
          <LinkKeyboardGroup className="actions" aria-label="Editorial journal links" aria-describedby="editorial-journal-hint">
            <Link className="text-link" href="/articles">Browse articles →</Link>
            <Link className="text-link" href="/tools">Free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </section>
        <section className="panel info-card">
          <h2>Something needs correcting?</h2>
          <p>Contact our team with the article link and the part you would like us to review. Corrections are not guaranteed outcomes changes.</p>
          <p className="sr-only" id="editorial-correction-hint">Arrow keys move between correction email, contact, free tools and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
          <LinkKeyboardGroup className="actions" aria-label="Editorial correction links" aria-describedby="editorial-correction-hint">
            <a className="text-link" href={correctionMailto}>
              Email an editorial correction →
              <span className="sr-only"> (opens your email app)</span>
            </a>
            <Link className="text-link" href="/contact">Contact support →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </section>
      </div>

      <aside className="notice offer-notice" aria-label="Get availability updates">
        <SiteIcon name="info" size={19} />
        <div className="offer-notice-body">
          <p>
            <strong>Reading first, booking later.</strong> New No Timer bookings stay closed for now — leave your email for a note when they open.{' '}
            <span className="sr-only" id="editorial-notify-hint">Arrow keys move between free tools and draft while you wait. Escape blurs. NotifyOpenForm still requires source. Skip remains site-content.</span>
            <LinkKeyboardGroup as="span" aria-label="Editorial notify alternatives" aria-describedby="editorial-notify-hint">
              <Link href="/tools">Try free tools</Link>
              {' · '}
              <Link href="/guidance/start">Prepare a draft</Link>
            </LinkKeyboardGroup>
          </p>
          <NotifyOpenForm source="website_editorial_policy" />
        </div>
      </aside>
    </InformationPage>
  );
}
