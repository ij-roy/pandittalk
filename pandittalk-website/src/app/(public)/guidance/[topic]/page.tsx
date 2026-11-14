import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { SoftResourceNotFound } from '@/components/site/SoftResourceNotFound';
import { topics } from '@/features/guidance/topics';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return Object.keys(topics).map(topic => ({ topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const topic = (await params).topic;
  const entry = topics[topic];
  if (!entry) {
    return {
      title: 'Guidance topic not found',
      description: 'That guidance topic is not available on Pandit Talk.',
      robots: { index: false, follow: true },
    };
  }
  return {
    title: entry.title,
    description: `${entry.intro} New No Timer bookings stay paused — prepare a private draft without charging coins.`,
    alternates: { canonical: `/guidance/${topic}` },
    openGraph: { title: `${entry.title} · Guidance`, description: `${entry.intro} Bookings stay paused; drafts never charge.`, url: `/guidance/${topic}` },
  };
}

export default async function Page({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const entry = topics[topic];
  if (!entry) {
    return (
      <SoftResourceNotFound
        eyebrow="Guidance"
        title="This guidance topic is not here."
        description="Topics change over time, or the link may be outdated. Opening a missing topic does not create a booking or charge. Browse all topics, prepare a private draft, or try a free tool."
        primaryHref="/guidance"
        primaryLabel="Browse all topics"
        links={[
          { href: '/guidance/start', label: 'Prepare a draft' },
          { href: '/tools', label: 'Try free tools' },
          { href: '/pandits', label: 'Explore Pandits' },
          { href: '/help', label: 'Help centre' },
        ]}
        notifySource="website_guidance_topic_missing"
      />
    );
  }

  return (
    <main id="main-content" className="page stack">
      <Link className="text-link" href="/guidance">← Explore all topics</Link>
      <p className="eyebrow">A place to begin</p>
      <h1>{entry.title}</h1>
      <p className="lede">{entry.intro}</p>
      <p className="expert-meta">New No Timer bookings stay paused — preparing a draft here never notifies a Pandit or charges coins.</p>

      <section className="panel stack">
        <h2>Questions worth bringing</h2>
        <ul className="topic-question-list">
          {entry.questions.map(question => <li key={question}>{question}</li>)}
        </ul>
        <p className="expert-meta">You can write one sentence or bring a question you cannot yet put into words. Share only what you are comfortable discussing.</p>
      </section>

      <section className="panel stack">
        <h2>Keep your choices in your hands</h2>
        <p>{entry.boundary}</p>
      </section>

      <p className="sr-only" id="guidance-topic-draft-hint">Arrow keys move between draft, chat-format draft, Pandits and free-tool links. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
      <LinkKeyboardGroup className="actions" aria-label={`${entry.title} draft next steps`} aria-describedby="guidance-topic-draft-hint">
        <Link href={`/guidance/start?area=${encodeURIComponent(topic)}`} className="button">Prepare a private draft</Link>
        <Link href={`/guidance/start?area=${encodeURIComponent(topic)}&format=chat`} className="button secondary">Save chat as preferred format (not live)</Link>
        <Link href="/pandits" className="text-link">Explore Pandits →</Link>
        <Link href="/tools" className="text-link">Try a free tool →</Link>
      </LinkKeyboardGroup>
      <nav className="panel stack" aria-label="Related guidance topics">
        <h2>Other topics</h2>
        <p className="sr-only" id="guidance-related-hint">Arrow keys move between related topics. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Other guidance topics" aria-describedby="guidance-related-hint">
          {Object.entries(topics)
            .filter(([key]) => key !== topic)
            .slice(0, 4)
            .map(([key, other]) => (
              <Link key={key} className="text-link" href={`/guidance/${key}`}>{other.title}</Link>
            ))}
          <Link className="text-link" href="/guidance">All guidance topics</Link>
        </LinkKeyboardGroup>
      </nav>
      <aside className="notice offer-notice" aria-label="Booking availability">
        <div className="offer-notice-body">
          <p>New No Timer bookings are not open yet. Preparing a draft does not create a charge. <span className="sr-only" id="guidance-topic-pause-hint">Arrow keys move between draft help, booking how-to, free tools and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</span><LinkKeyboardGroup as="span" aria-label="Guidance topic pause links" aria-describedby="guidance-topic-pause-hint"><Link href="/help/preparing-a-draft">Draft help</Link> · <Link href="/how-it-works#booking-availability-how">How booking will work</Link> · <Link href="/tools">Try free tools</Link> · <Link href={`/guidance/start?area=${encodeURIComponent(topic)}`}>Prepare a draft</Link></LinkKeyboardGroup>.</p>
          <p className="expert-meta">Want a note when No Timer booking opens?</p>
          <NotifyOpenForm source={`website_guidance_topic_${topic}`} />
        </div>
      </aside>
    </main>
  );
}
