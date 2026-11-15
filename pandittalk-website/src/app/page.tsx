import Link from 'next/link';
import { EscapeBlurNotice } from '@/components/site/EscapeBlurNotice';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { FocusOnHash } from '@/components/site/FocusOnHash';
import { HomeFaq } from '@/components/site/HomeFaq';
import { SiteIcon, type SiteIconName } from '@/components/site/SiteIcon';
import { ExpertDirectory } from '@/features/experts/ExpertDirectory';
import { SITE_URL } from '@/lib/articles/site';
import type { Metadata } from 'next';
import { availabilityCopy } from '@/content/availability';

export const metadata: Metadata = {
  title: { absolute: 'Pandit Talk — You Talk. We Stay.' },
  description: 'Traditional wisdom, real Pandits and modern technology for thoughtful conversations with room to explain. New conversations are opening soon.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Pandit Talk — You Talk. We Stay.',
    description: 'Traditional wisdom, real Pandits and modern technology for thoughtful conversations with room to explain. New conversations are opening soon.',
    url: '/',
  },
};

const topics: { slug: string; label: string; icon: SiteIconName }[] = [
  { slug: 'career', label: 'Career', icon: 'career' },
  { slug: 'love', label: 'Love', icon: 'heart' },
  { slug: 'family', label: 'Family', icon: 'family' },
  { slug: 'marriage', label: 'Marriage', icon: 'rings' },
  { slug: 'education', label: 'Education', icon: 'book' },
  { slug: 'health', label: 'Wellbeing', icon: 'health' },
  { slug: 'business', label: 'Business', icon: 'business' },
  { slug: 'finance', label: 'Finances', icon: 'coins' },
];

function EditorialArt() {
  return <svg className="editorial-art" viewBox="0 0 160 120" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" focusable="false">
    <circle cx="80" cy="55" r="45" opacity=".3" />
    <circle cx="80" cy="55" r="37" opacity=".3" />
    <path d="M80 92C50 68 59 38 80 22c21 16 30 46 0 70Z" />
    <path d="M80 92C45 89 29 63 34 40c27 0 46 18 46 52ZM80 92c35-3 51-29 46-52-27 0-46 18-46 52Z" />
    <path d="M80 92C47 104 20 88 17 68c28-10 51 0 63 24ZM80 92c33 12 60-4 63-24-28-10-51 0-63 24Z" />
    <path d="M42 105h76M60 111h40M80 22v70" opacity=".6" />
    <circle cx="80" cy="8" r="2" fill="currentColor" stroke="none" />
  </svg>;
}

const homeFaqs = [
  {
    q: 'What should I bring to a conversation?',
    a: 'You do not need a perfect question. Bring the topic that feels closest, and only the details you are comfortable sharing. New conversations are opening soon — you can prepare a private draft now without creating a charge.',
    linkHref: '/help/first-consultation',
    linkLabel: 'Preparing while bookings stay closed →',
  },
  {
    q: 'How do coins and pricing work?',
    a: 'Coins and INR are separate units. New purchases are paused while service terms are finalized. Existing bookings keep their agreed terms.',
    linkHref: '/pricing',
    linkLabel: 'See pricing details →',
  },
  {
    q: 'Are astrology tools the same as talking to a Pandit?',
    a: 'No. Tools are automated and labelled as such. A live conversation is with a person — and new conversations are opening soon.',
    linkHref: '/tools',
    linkLabel: 'Explore labelled tools →',
  },
  {
    q: 'Is my saved story shared automatically?',
    a: 'No. Signed-in notes stay private until you choose to share them for a specific booking and Pandit.',
    linkHref: '/how-it-works#your-story',
    linkLabel: 'How your story stays with you →',
  },
  {
    q: 'What if something goes wrong?',
    a: 'Keep your booking or payment reference and contact support. Formal grievances have a dedicated redressal path.',
    linkHref: '/help/refunds-and-complaints',
    linkLabel: 'Refunds and complaints →',
  },
  {
    q: 'Can I book a conversation right now?',
    a: `${availabilityCopy.publicStatus} You can explore Pandits, try tools, prepare a draft, and leave your email for updates.`,
    linkHref: '/how-it-works#booking-availability-how',
    linkLabel: 'Get notified →',
  },
] as const;

export default function Home() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFaqs.map(item => {
      const path = item.linkHref.split('#')[0];
      return {
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${item.a} See ${SITE_URL}${path} for more detail.`,
        },
        url: `${SITE_URL}/#faq`,
      };
    }),
  };

  return <main id="main-content" className="page home-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    <FocusOnHash hash="#booking-availability" targetId="booking-availability" />
    <section className="hero" aria-labelledby="home-title">
      <div>
        <p className="eyebrow">Traditional wisdom · Real Pandits · Modern technology</p>
        <p className="hero-brand">Pandit Talk</p>
        <h1 id="home-title">Find a calmer next step for the question on your mind.</h1>
        <p className="supporting">Real Pandits, free reflection tools, and a private place to prepare. Explore the people and topics that feel relevant now; new conversations are opening soon.</p>
        <p className="sr-only" id="home-hero-hint">Arrow keys move between hero actions. Escape blurs the focused link. Skip remains site-content. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Home hero actions" aria-describedby="home-hero-hint">
          <Link className="button" href="/pandits">Explore Pandits<SiteIcon name="right" size={18} /></Link>
          <Link className="button secondary" href="/tools">Try a free tool</Link>
          <Link className="hero-secondary" href="/guidance/start">Prepare a private draft<SiteIcon name="right" size={17} /></Link>
        </LinkKeyboardGroup>
        <EscapeBlurNotice
          className="hero-availability"
          id="booking-availability"
          role="region"
          aria-label="Booking availability"
        >
          <p><strong>{availabilityCopy.publicStatus}</strong> {availabilityCopy.publicDetail} {availabilityCopy.noTimerExplanation}</p>
          <NotifyOpenForm source="website_home_hero" submitLabel="Get one email" fieldLabel={availabilityCopy.waitlistLabel} helpText={availabilityCopy.waitlistHelp} />
        </EscapeBlurNotice>
      </div>
      <aside className="editorial-mark" aria-label="The Pandit Talk philosophy">
        <EditorialArt />
        <p className="devanagari" lang="hi">बात आपकी।<br />ध्यान हमारा।</p>
        <div><p>You Talk. We Stay.</p><span className="small">Aapki baat. Dhyaan se.</span></div>
        <span className="editorial-caption"><SiteIcon name="spark" size={15} />Reflect. Prepare. Decide.</span>
      </aside>
    </section>

    <section className="section split-section" aria-labelledby="home-conversation-title">
      <div className="section-copy">
        <p className="eyebrow">A conversation, with room</p>
        <h2 id="home-conversation-title">Three things that make a conversation useful.</h2>
        <p className="lede">You should leave with clarity about your question and a next step — not a race against a clock.</p>
        <p className="sr-only" id="home-conversation-hint">Arrow keys move between conversation links. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup as="p" aria-label="Home conversation links" aria-describedby="home-conversation-hint">
          <Link className="text-link" href="/how-it-works">See how conversations work<SiteIcon name="right" size={18} /></Link>
          {' · '}
          <Link className="text-link" href="/pricing">Pricing and service terms<SiteIcon name="right" size={18} /></Link>
          {' · '}
          <Link className="text-link" href="/tools">Try free tools<SiteIcon name="right" size={18} /></Link>
        </LinkKeyboardGroup>
      </div>
      <div>
        <ol className="numbered-lines"><li>Room to explain.</li><li>Time to understand.</li><li>A next step you choose.</li></ol>
        <p className="expert-meta">Resolution means clarity about your question and a next step. Your choices and life&apos;s outcomes remain your own.</p>
      </div>
    </section>

    <section className="panel story-section split-section" aria-labelledby="home-story-title">
      <div>
        <p className="eyebrow">Your words matter</p>
        <h2 id="home-story-title">Your story shouldn&apos;t have to start from zero every time.</h2>
        <p className="lede">Keep what matters from your last conversation. Choose what you want to share, and pick up from there.</p>
        <p className="sr-only" id="home-story-hint">Arrow keys move between story links. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup as="p" aria-label="Home story links" aria-describedby="home-story-hint">
          <Link className="text-link" href="/how-it-works#your-story">How your story stays with you<SiteIcon name="right" size={18} /></Link>
          {' · '}
          <Link className="text-link" href="/login?returnTo=%2Faccount%2Fstory&reason=auth">Sign in to manage your story</Link>
          {' · '}
          <Link className="text-link" href="/guidance/start">Prepare a draft</Link>
        </LinkKeyboardGroup>
      </div>
      <div>
        <ol className="story-sequence" aria-label="How your story carries forward">
          <li><SiteIcon name="chat" size={17} />Your words</li>
          <li>Your saved context</li>
          <li>When booking opens</li>
        </ol>
        <blockquote className="story-note">
          <span className="story-note-label"><SiteIcon name="note" size={17} />A note to come back to</span>
          “Last time, I wanted to talk about a change at work.”
          <p className="expert-meta">Example of a user-authored note · not a testimonial</p>
        </blockquote>
        <p className="story-privacy">Your saved context is private. Choose the booking and Pandit before sharing anything.</p>
      </div>
    </section>

    <section className="section split-section" aria-labelledby="home-topics-title">
      <div className="section-copy">
        <p className="eyebrow">Start where you are</p>
        <h2 id="home-topics-title">What would you like to talk about?</h2>
        <p className="lede">A big decision. A small worry. Or something you haven&apos;t quite found the words for.</p>
        <p>You don&apos;t need to have the perfect question.</p>
      </div>
      <p className="sr-only" id="home-topics-keys">Arrow keys move between topic chips. Escape blurs the focused link. Skip remains site-content.</p>
      <LinkKeyboardGroup as="nav" className="topic-links" aria-label="Guidance topics" aria-describedby="home-topics-keys">
        {topics.map(topic => <Link key={topic.slug} href={'/guidance/' + topic.slug}><SiteIcon name={topic.icon} /><span>{topic.label}</span><SiteIcon name="right" size={17} /></Link>)}
      </LinkKeyboardGroup>
    </section>

    <section className="section" aria-labelledby="home-pandits-title">
      <div className="section-heading"><div>
        <p className="eyebrow">Know the person</p>
        <h2 id="home-pandits-title">Meet Pandits before booking opens.</h2>
        <p className="lede">Read their own introduction, explore their practice and choose a language that feels comfortable. Profiles are for preparation — not an open booking button.</p>
      </div></div>
      <ExpertDirectory compact />
    </section>

    <section className="section split-section learning-section" aria-labelledby="home-learning-title">
      <div>
        <p className="eyebrow">A little space to explore</p>
        <h2 id="home-learning-title">A profile to explore.<br />A thought to read.</h2>
        <p className="lede">Some days you want to meet a Pandit for later. Other days, a journal piece or free tool is enough for now.</p>
      </div>
      <p className="sr-only" id="home-learning-keys">Arrow keys move between journal and tools cards. Escape blurs the focused card. Skip remains site-content.</p>
      <LinkKeyboardGroup className="learning-cards" aria-label="Journal and tools" aria-describedby="home-learning-keys">
        <Link href="/articles" className="panel learning-card"><SiteIcon name="book" size={28} /><h3>The journal</h3><p>Thoughtful reading, with a named author behind every article.</p><span className="text-link">Find a new perspective <SiteIcon name="right" size={17} /></span></Link>
        <Link href="/tools" className="panel learning-card"><SiteIcon name="spark" size={28} /><h3>A moment of reflection</h3><p>Explore automated astrology tools, separate from a personal consultation.</p><span className="text-link">Explore the tools <SiteIcon name="right" size={17} /></span></Link>
      </LinkKeyboardGroup>
    </section>

    <section className="section" id="faq" aria-labelledby="home-faq-title">
      <p className="eyebrow">Feel a little more prepared</p>
      <h2 id="home-faq-title">A few things you might be wondering.</h2>
      <HomeFaq items={homeFaqs} />
      <div className="closing-note">
        <div>
          <h3>Start with a little curiosity.</h3>
          <p>Explore Pandits, try a tool, and prepare your questions. New conversations are opening soon — nothing here creates a charge.</p>
        </div>
        <p className="sr-only" id="home-closing-hint">Arrow keys move between closing actions. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Home closing actions" style={{ margin: 0 }} aria-describedby="home-closing-hint">
          <Link className="button" href="/pandits">Explore Pandits<SiteIcon name="right" size={18} /></Link>
          <Link className="button secondary" href="/tools">Try a free tool</Link>
          <Link className="button secondary" href="/guidance/start">Prepare a private draft</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
        </LinkKeyboardGroup>
      </div>
    </section>
  </main>;
}
