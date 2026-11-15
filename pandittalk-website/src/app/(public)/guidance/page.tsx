import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { OfferNotice } from '@/components/site/OfferNotice';
import { topics } from '@/features/guidance/topics';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find guidance',
  description: 'Choose a life area — career, love, family, marriage, education, health, business or finance — and prepare a private draft. New conversations are opening soon.',
  alternates: { canonical: '/guidance' },
  openGraph: {
    title: 'Find guidance · Pandit Talk',
    description: 'Choose a life area and prepare a private draft while new conversations are opening soon.',
    url: '/guidance',
  },
};

export default function Page() {
  return (
    <main id="main-content" className="page stack">
      <p className="eyebrow">Space for what matters</p>
      <h1>You do not need a perfect question to begin.</h1>
      <p className="lede">Traditional wisdom can offer a way to reflect on the decisions, relationships and responsibilities in front of you. Begin with the area that feels closest — preparing here never opens a booking or charges coins.</p>
      <OfferNotice compact source="website_guidance_index" />
      <p className="sr-only" id="guidance-index-next-hint">Arrow keys move between Prepare, Browse Pandits, free tools and draft help. Escape blurs. OfferNotice still requires source.</p>
      <LinkKeyboardGroup className="actions" aria-label="Guidance index next steps" aria-describedby="guidance-index-next-hint">
        <Link href="/guidance/start" className="button">Prepare a private draft</Link>
        <Link href="/pandits" className="button secondary">Browse Pandits first</Link>
        <Link href="/tools" className="button secondary">Try a free tool</Link>
        <Link href="/help/preparing-a-draft" className="text-link">Draft help →</Link>
      </LinkKeyboardGroup>
      <p className="sr-only" id="guidance-topics-hint">Arrow keys move between guidance topics. Home and End jump to the first or last. Escape blurs the focused card.</p>
      <LinkKeyboardGroup className="grid" role="list" aria-label="Guidance topics" aria-describedby="guidance-topics-hint">
        {Object.entries(topics).map(([key, topic]) => (
          <Link key={key} href={`/guidance/${key}`} className="panel" role="listitem">
            <h2>{topic.title}</h2>
            <p>{topic.intro}</p>
            <span className="text-link">Draft ideas for {topic.title}</span>
          </Link>
        ))}
      </LinkKeyboardGroup>
      <section className="panel stack">
        <h2>A conversation with room to think</h2>
        <p>Bring your own beliefs and decide what is useful to you. Guidance should leave you with clearer questions and an actionable next step, not fear or a guaranteed prediction.</p>
        <p className="expert-meta">New conversations are opening soon. Existing bookings remain accessible under their original terms.</p>
        <p className="sr-only" id="guidance-booking-hint">Arrow keys move between sign-in and booking-update links. Escape blurs the focused link.</p>
        <LinkKeyboardGroup as="p" aria-label="Guidance index booking links" aria-describedby="guidance-booking-hint">
          <Link className="text-link" href="/login?returnTo=%2Fbookings&reason=auth">Sign in to view bookings</Link>
          {' · '}
          <Link className="text-link" href="/how-it-works#booking-availability-how">Get a note when booking opens</Link>
        </LinkKeyboardGroup>
      </section>
    </main>
  );
}
