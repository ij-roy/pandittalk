import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroAurora } from '@/components/site/HeroAurora';
import { HomeFaq } from '@/components/site/HomeFaq';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { RevealOnScroll } from '@/components/site/RevealOnScroll';
import { SiteIcon, type SiteIconName } from '@/components/site/SiteIcon';
import { SpotlightCard } from '@/components/site/SpotlightCard';
import { SITE_URL } from '@/lib/articles/site';

export const metadata: Metadata = {
  title: { absolute: 'Pandit Talk — Talk to a real Pandit online' },
  description: 'Find a real Pandit for private online guidance about love, marriage, career, family, or finances. Compare profiles, chat now, or book a timed session.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Pandit Talk — Talk to a real Pandit online',
    description: 'Find a real Pandit for private online guidance about love, marriage, career, family, or finances. Compare profiles, chat now, or book a timed session.',
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

const homeFaqs = [
  {
    q: 'Can I book a conversation right now?',
    a: 'Yes. Open a Pandit profile to compare scheduled times and Chat Now availability. You will see the duration and total before the booking service confirms anything.',
    linkHref: '/pandits',
    linkLabel: 'Explore Pandit profiles →',
  },
  {
    q: 'What should I bring to a conversation?',
    a: 'You do not need a perfect question. Bring the topic that feels closest and only the details you are comfortable sharing. Notes are optional when you book.',
    linkHref: '/help/first-consultation',
    linkLabel: 'See how to prepare →',
  },
  {
    q: 'Will I talk to a real Pandit or an automated tool?',
    a: 'Consultations are with the person shown on the Pandit profile. Free tools are automated and clearly labelled, and they stay separate from a personal conversation.',
    linkHref: '/tools',
    linkLabel: 'Explore labelled tools →',
  },
  {
    q: 'Is my saved draft shared automatically?',
    a: 'No. Your draft stays private. You choose whether to keep it on this browser, manage it in your account, or share it for a future booking.',
    linkHref: '/how-it-works#your-story',
    linkLabel: 'How your story stays with you →',
  },
] as const;

function HeroOrbitArt() {
  return <div className="hero-orbit-art" aria-hidden="true">
    <span className="hero-orbit-ring hero-orbit-ring-one" />
    <span className="hero-orbit-ring hero-orbit-ring-two" />
    <span className="hero-orbit-dot" />
    <svg viewBox="0 0 120 94" fill="none" stroke="currentColor" strokeWidth="1.25" focusable="false">
      <path d="M60 76C38 58 44 34 60 21c16 13 22 37 0 55Z" />
      <path d="M60 76C34 74 23 55 27 38c19 1 33 14 33 38ZM60 76c26-2 37-21 33-38-19 1-33 14-33 38Z" />
      <path d="M60 76C35 85 15 73 13 58c21-7 38 1 47 18ZM60 76c25 9 45-3 47-18-21-7-38 1-47 18Z" />
      <path d="M31 86h58M44 91h32M60 21v55" opacity=".55" />
      <circle cx="60" cy="10" r="2" fill="currentColor" stroke="none" />
    </svg>
  </div>;
}

export default function Home() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFaqs.map(item => {
      const path = item.linkHref.split('#')[0];
      return {
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: `${item.a} See ${SITE_URL}${path} for more detail.` },
        url: `${SITE_URL}/#faq`,
      };
    }),
  };

  return <main id="main-content" className="page home-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

    <section className="hero" aria-labelledby="home-title">
      <HeroAurora />
      <div className="hero-copy">
        <h1 id="home-title">Talk to a real Pandit about what’s on your mind.</h1>
        <p className="supporting">Find guidance for love, marriage, career, family, or finances. Compare Pandit profiles, languages, and availability, then start a private chat or book a timed session.</p>
        <Link className="button" href="/pandits">Find a Pandit<SiteIcon name="right" size={18} /></Link>
      </div>

      <aside className="hero-guide-card panel" aria-labelledby="hero-guide-title">
        <HeroOrbitArt />
        <div className="hero-guide-content">
          <h2 id="hero-guide-title">Find the right Pandit for your question.</h2>
          <ol className="hero-guide-steps">
            <li><span>1</span><div><strong>Choose a topic</strong><small>Start with love, marriage, career, family, or finance.</small></div></li>
            <li><span>2</span><div><strong>Compare Pandits</strong><small>Read their profile, languages, practice areas, and availability.</small></div></li>
            <li><span>3</span><div><strong>Start your conversation</strong><small>Chat now or book a private timed session.</small></div></li>
          </ol>
          <ul className="hero-trust-list" aria-label="What you can expect">
            <li><SiteIcon name="user" size={17} />Real Pandit profiles</li>
            <li><SiteIcon name="lock" size={17} />Private conversations</li>
            <li><SiteIcon name="spark" size={17} />Browse for free</li>
            <li><SiteIcon name="info" size={17} />Terms shown first</li>
          </ul>
          <p className="hero-guide-note">Conversations are with real Pandits. Automated tools are separate and clearly labelled.</p>
        </div>
      </aside>
    </section>

    <RevealOnScroll>
      <section className="section home-topics-section" aria-labelledby="home-topics-title">
        <div className="home-section-intro">
          <h2 id="home-topics-title">Find guidance for your question.</h2>
          <p className="lede">Choose a topic to see Pandits who can help. You can change your mind later.</p>
        </div>
        <p className="sr-only" id="home-topics-keys">Arrow keys move between topic choices. Escape blurs the focused link.</p>
        <LinkKeyboardGroup as="nav" className="topic-links" aria-label="Guidance topics" aria-describedby="home-topics-keys">
          {topics.map(topic => <Link key={topic.slug} href={`/guidance/${topic.slug}`}><SiteIcon name={topic.icon} /><span>{topic.label}</span><SiteIcon name="right" size={17} /></Link>)}
        </LinkKeyboardGroup>
      </section>
    </RevealOnScroll>

    <RevealOnScroll>
      <section className="section home-assurance-section" aria-labelledby="home-assurance-title">
        <div className="home-section-intro">
          <h2 id="home-assurance-title">How PanditTalk works</h2>
          <p className="lede">Find a person, understand your options, and choose a private conversation when you&apos;re ready.</p>
        </div>
        <div className="trust-card-grid">
          <SpotlightCard className="panel trust-card">
            <span className="trust-card-icon"><SiteIcon name="user" size={23} /></span>
            <h3>Know who you will speak with</h3>
            <p>Read each Pandit&apos;s own introduction, practice areas, languages, and published profile details.</p>
          </SpotlightCard>
          <SpotlightCard className="panel trust-card">
            <span className="trust-card-icon"><SiteIcon name="lock" size={23} /></span>
            <h3>Prepare your question privately</h3>
            <p>Write a draft on your own device. You decide whether it becomes part of a future conversation.</p>
          </SpotlightCard>
          <SpotlightCard className="panel trust-card">
            <span className="trust-card-icon"><SiteIcon name="spark" size={23} /></span>
            <h3>Chat or book with clear terms</h3>
            <p>Choose Chat Now or a scheduled session. See the format, duration, and total before you confirm.</p>
          </SpotlightCard>
        </div>
        <p className="sr-only" id="home-assurance-hint">Arrow keys move between process and trust links. Escape blurs the focused link.</p>
        <LinkKeyboardGroup className="home-inline-links" aria-label="Learn about the service" aria-describedby="home-assurance-hint">
          <Link className="text-link" href="/how-it-works">See how it works<SiteIcon name="right" size={17} /></Link>
          <Link className="text-link" href="/trust">Read our trust and care approach<SiteIcon name="right" size={17} /></Link>
        </LinkKeyboardGroup>
        <div className="home-draft-note">
          <p className="home-draft-note-label">Prefer to prepare first? <Link className="text-link" href="/guidance/start">Write a private draft<SiteIcon name="right" size={17} /></Link></p>
          <p className="home-draft-note-copy">It stays in this browser, is not shared with a Pandit, and does not create a booking.</p>
        </div>
      </section>
    </RevealOnScroll>

    <RevealOnScroll>
      <section className="section pandit-preview-section" aria-labelledby="home-pandits-title">
        <div className="pandit-preview-copy">
          <h2 id="home-pandits-title">Compare Pandits before you book.</h2>
          <p className="lede">See their introductions, topics, languages, and live options before choosing a chat or timed session.</p>
          <ul className="profile-check-list">
            <li><SiteIcon name="chat" size={19} />Introduction and experience</li>
            <li><SiteIcon name="book" size={19} />Topics and approach</li>
            <li><SiteIcon name="family" size={19} />Languages and availability</li>
          </ul>
          <Link className="button" href="/pandits">Find a Pandit<SiteIcon name="right" size={18} /></Link>
        </div>
        <div className="profile-preview-visual panel" aria-label="What you can review before booking a Pandit">
          <div className="profile-preview-heading">
            <span className="profile-preview-avatar"><SiteIcon name="user" size={26} /></span>
            <div><strong>What you see before booking</strong><small>Review the details before you choose a conversation</small></div>
          </div>
          <div className="profile-preview-row"><SiteIcon name="chat" size={19} /><div><strong>Profile and introduction</strong><span>See how the Pandit describes their work and experience.</span></div></div>
          <div className="profile-preview-row"><SiteIcon name="book" size={19} /><div><strong>Practice areas</strong><span>Check whether they help with your topic.</span></div></div>
          <div className="profile-preview-row"><SiteIcon name="family" size={19} /><div><strong>Languages and live options</strong><span>Choose a comfortable language and available format.</span></div></div>
          <p className="profile-preview-note"><SiteIcon name="info" size={17} />Browsing does not create a booking or charge.</p>
        </div>
      </section>
    </RevealOnScroll>

    <RevealOnScroll>
      <section className="section split-section learning-section" aria-labelledby="home-learning-title">
        <div>
          <h2 id="home-learning-title">Not ready to talk? Start with a free tool or article.</h2>
          <p className="lede">These are optional starting points. Tools are automated and labelled; articles are written by named authors. Neither starts a consultation.</p>
        </div>
        <p className="sr-only" id="home-learning-keys">Arrow keys move between journal and tools cards. Escape blurs the focused card.</p>
        <LinkKeyboardGroup className="learning-cards" aria-label="Journal and tools" aria-describedby="home-learning-keys">
          <Link href="/articles" className="panel learning-card"><SiteIcon name="book" size={28} /><h3>The journal</h3><p>Read articles about astrology, relationships, career, and more from named authors.</p><span className="text-link">Read the journal <SiteIcon name="right" size={17} /></span></Link>
          <Link href="/tools" className="panel learning-card"><SiteIcon name="spark" size={28} /><h3>Free automated tools</h3><p>Try a labelled tool before deciding whether you want a personal conversation.</p><span className="text-link">Explore free tools <SiteIcon name="right" size={17} /></span></Link>
        </LinkKeyboardGroup>
      </section>
    </RevealOnScroll>

    <RevealOnScroll>
      <section className="section home-faq-section" id="faq" aria-labelledby="home-faq-title">
        <div className="home-section-intro">
          <h2 id="home-faq-title">Before you book</h2>
        </div>
        <HomeFaq items={homeFaqs} />
      </section>
    </RevealOnScroll>

  </main>;
}
