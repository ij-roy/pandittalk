import type { Metadata } from 'next';
import Link from 'next/link';
import { availabilityCopy } from '@/content/availability';
import { FocusOnHash } from '@/components/site/FocusOnHash';
import { HomeFaq } from '@/components/site/HomeFaq';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { RevealOnScroll } from '@/components/site/RevealOnScroll';
import { SiteIcon, type SiteIconName } from '@/components/site/SiteIcon';
import { SpotlightCard } from '@/components/site/SpotlightCard';
import { SITE_URL } from '@/lib/articles/site';

export const metadata: Metadata = {
  title: { absolute: 'Pandit Talk — You Talk. We Stay.' },
  description: 'Explore real Pandit profiles, prepare your question privately, and use free reflection tools while new conversations get ready to open.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Pandit Talk — You Talk. We Stay.',
    description: 'Explore real Pandit profiles, prepare your question privately, and use free reflection tools while new conversations get ready to open.',
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
    a: `${availabilityCopy.publicStatus} You can explore profiles, prepare a private draft, try free tools, and leave one email for an availability update. Nothing on this page starts a booking or charge.`,
    linkHref: '/how-it-works#booking-availability-how',
    linkLabel: 'See the current booking status →',
  },
  {
    q: 'What should I bring to a conversation?',
    a: 'You do not need a perfect question. Bring the topic that feels closest and only the details you are comfortable sharing. You can prepare a private draft now.',
    linkHref: '/help/first-consultation',
    linkLabel: 'See how to prepare →',
  },
  {
    q: 'Are astrology tools the same as talking to a Pandit?',
    a: 'No. Tools are automated and clearly labelled. A conversation is with a person whose profile, practice areas, and languages you can review first.',
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
    <FocusOnHash hash="#booking-availability" targetId="booking-availability" />

    <section className="hero" aria-labelledby="home-title">
      <div className="hero-copy">
        <p className="eyebrow">Traditional wisdom · Real people · Your pace</p>
        <h1 id="home-title">Find a calmer next step for the question on your mind.</h1>
        <p className="supporting">Meet Pandits through their own profiles, put your thoughts into words privately, and explore free tools before deciding what feels right.</p>
        <p className="sr-only" id="home-hero-hint">Arrow keys move between the two main choices. Escape blurs the focused link.</p>
        <LinkKeyboardGroup className="actions" aria-label="Home hero actions" aria-describedby="home-hero-hint">
          <Link className="button" href="/pandits">Explore Pandits<SiteIcon name="right" size={18} /></Link>
          <Link className="button secondary" href="/guidance/start">Prepare a private draft</Link>
        </LinkKeyboardGroup>
        <p className="hero-status"><span aria-hidden="true" />{availabilityCopy.publicStatus} <Link href="#booking-availability">Get one email when that changes</Link></p>
      </div>

      <aside className="hero-guide-card panel" aria-labelledby="hero-guide-title">
        <HeroOrbitArt />
        <div className="hero-guide-content">
          <p className="eyebrow">A thoughtful way to begin</p>
          <h2 id="hero-guide-title">You do not need the perfect question.</h2>
          <ol className="hero-guide-steps">
            <li><span>1</span><div><strong>Start with a topic</strong><small>Choose what feels closest today.</small></div></li>
            <li><span>2</span><div><strong>Know the person</strong><small>Read their introduction and languages.</small></div></li>
            <li><span>3</span><div><strong>Decide in your own time</strong><small>Prepare first; choose a next step later.</small></div></li>
          </ol>
          <ul className="hero-trust-list" aria-label="What you can expect">
            <li><SiteIcon name="user" size={17} />Real profiles</li>
            <li><SiteIcon name="lock" size={17} />Private preparation</li>
            <li><SiteIcon name="spark" size={17} />Free to explore</li>
            <li><SiteIcon name="info" size={17} />No charge today</li>
          </ul>
        </div>
      </aside>
    </section>

    <RevealOnScroll>
      <section className="section home-topics-section" aria-labelledby="home-topics-title">
        <div className="home-section-intro">
          <p className="eyebrow">Start where you are</p>
          <h2 id="home-topics-title">What would you like to talk about?</h2>
          <p className="lede">A decision, a relationship, or something you have not quite found the words for yet.</p>
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
          <p className="eyebrow">Clarity before commitment</p>
          <h2 id="home-assurance-title">A human service with clear boundaries.</h2>
          <p className="lede">Understand the person, protect your words, and know what each next step does before you choose it.</p>
        </div>
        <div className="trust-card-grid">
          <SpotlightCard className="panel trust-card">
            <span className="trust-card-icon"><SiteIcon name="user" size={23} /></span>
            <h3>Know who you are meeting</h3>
            <p>Read each Pandit&apos;s own introduction, practice areas, languages, and published profile details.</p>
          </SpotlightCard>
          <SpotlightCard className="panel trust-card">
            <span className="trust-card-icon"><SiteIcon name="lock" size={23} /></span>
            <h3>Prepare in private</h3>
            <p>Write a draft on your own device. You decide whether it becomes part of a future conversation.</p>
          </SpotlightCard>
          <SpotlightCard className="panel trust-card">
            <span className="trust-card-icon"><SiteIcon name="spark" size={23} /></span>
            <h3>Move at your pace</h3>
            <p>Browse profiles and free tools without starting a booking, payment, or conversation.</p>
          </SpotlightCard>
        </div>
        <p className="sr-only" id="home-assurance-hint">Arrow keys move between process and trust links. Escape blurs the focused link.</p>
        <LinkKeyboardGroup className="home-inline-links" aria-label="Learn about the service" aria-describedby="home-assurance-hint">
          <Link className="text-link" href="/how-it-works">See how it works<SiteIcon name="right" size={17} /></Link>
          <Link className="text-link" href="/trust">Read our trust and care approach<SiteIcon name="right" size={17} /></Link>
        </LinkKeyboardGroup>
      </section>
    </RevealOnScroll>

    <RevealOnScroll>
      <section className="section pandit-preview-section" aria-labelledby="home-pandits-title">
        <div className="pandit-preview-copy">
          <p className="eyebrow">Know the person first</p>
          <h2 id="home-pandits-title">Meet Pandits before you decide.</h2>
          <p className="lede">The directory is built for comparison, not pressure. Look at the details that help you feel comfortable, then return when you are ready.</p>
          <ul className="profile-check-list">
            <li><SiteIcon name="chat" size={19} />Their own introduction</li>
            <li><SiteIcon name="book" size={19} />Practice areas and approach</li>
            <li><SiteIcon name="family" size={19} />Languages they list</li>
          </ul>
          <Link className="button" href="/pandits">Explore Pandit profiles<SiteIcon name="right" size={18} /></Link>
        </div>
        <div className="profile-preview-visual panel" aria-label="What a Pandit profile helps you review">
          <div className="profile-preview-heading">
            <span className="profile-preview-avatar"><SiteIcon name="user" size={26} /></span>
            <div><strong>Profile at a glance</strong><small>Details before any future booking</small></div>
          </div>
          <div className="profile-preview-row"><SiteIcon name="chat" size={19} /><div><strong>Introduction</strong><span>Hear how the Pandit describes their work.</span></div></div>
          <div className="profile-preview-row"><SiteIcon name="book" size={19} /><div><strong>Practice and approach</strong><span>See the topics and methods they list.</span></div></div>
          <div className="profile-preview-row"><SiteIcon name="family" size={19} /><div><strong>Languages</strong><span>Choose a language that feels comfortable.</span></div></div>
          <p className="profile-preview-note"><SiteIcon name="info" size={17} />Profiles are for exploration. Availability is shown honestly.</p>
        </div>
      </section>
    </RevealOnScroll>

    <RevealOnScroll>
      <section className="section split-section learning-section" aria-labelledby="home-learning-title">
        <div>
          <p className="eyebrow">Explore at your pace</p>
          <h2 id="home-learning-title">A useful next step can still be small.</h2>
          <p className="lede">Read a thoughtful article or try a clearly labelled automated tool. Neither one starts a booking.</p>
        </div>
        <p className="sr-only" id="home-learning-keys">Arrow keys move between journal and tools cards. Escape blurs the focused card.</p>
        <LinkKeyboardGroup className="learning-cards" aria-label="Journal and tools" aria-describedby="home-learning-keys">
          <Link href="/articles" className="panel learning-card"><SiteIcon name="book" size={28} /><h3>The journal</h3><p>Thoughtful reading with a named author behind every article.</p><span className="text-link">Find a new perspective <SiteIcon name="right" size={17} /></span></Link>
          <Link href="/tools" className="panel learning-card"><SiteIcon name="spark" size={28} /><h3>Free reflection tools</h3><p>Automated experiences that stay separate from a personal conversation.</p><span className="text-link">Explore the tools <SiteIcon name="right" size={17} /></span></Link>
        </LinkKeyboardGroup>
      </section>
    </RevealOnScroll>

    <RevealOnScroll>
      <section className="section home-faq-section" id="faq" aria-labelledby="home-faq-title">
        <div className="home-section-intro">
          <p className="eyebrow">Know before you begin</p>
          <h2 id="home-faq-title">A few honest answers.</h2>
        </div>
        <HomeFaq items={homeFaqs} />
      </section>
    </RevealOnScroll>

    <RevealOnScroll>
      <section className="section home-update" id="booking-availability" aria-labelledby="home-update-title" tabIndex={-1}>
        <div className="home-update-panel panel">
          <div>
            <p className="eyebrow">One useful update</p>
            <h2 id="home-update-title">Know when new conversations open.</h2>
            <p>Leave one email and we will write when availability changes. You can keep exploring without joining a marketing list.</p>
          </div>
          <NotifyOpenForm source="website_home_update" submitLabel="Email me once" fieldLabel={availabilityCopy.waitlistLabel} helpText={availabilityCopy.waitlistHelp} />
        </div>
      </section>
    </RevealOnScroll>
  </main>;
}
