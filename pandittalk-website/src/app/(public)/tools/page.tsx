import Link from 'next/link';
import { FocusOnHash } from '@/components/site/FocusOnHash';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { SiteIcon } from '@/components/site/SiteIcon';
import type { Metadata } from 'next';

const freeTools = [
  ["kundli","Kundli",'Explore your birth chart and planetary placements.'],
  ["horoscope","Daily horoscope",'A small pause to reflect on the day.'],
  ["compatibility","Compatibility",'Explore connection, communication and harmony.'],
  ["numerology","Numerology practices",'Browse visual prompts for your Mulank.'],
  ["palm-reading","Palm reading",'An AI interpretation of both palms.'],
  ["tarot","Tarot",'A randomly drawn card and a fresh perspective.'],
] as const;

const pausedTools = [
  { route: 'kundli/detailed', title: 'Detailed Kundli', description: 'Existing reports remain available. New purchases are paused while terms are finalized.' },
  { route: 'compatibility/detailed', title: 'Detailed compatibility', description: 'Existing reports remain available. New purchases are paused while terms are finalized.' },
  { route: 'monthly-horoscope', title: 'Monthly horoscope', description: 'Existing reports remain available. New purchases are paused while terms are finalized.' },
] as const;

export const metadata: Metadata = {
  title: 'Astrology tools',
  description: 'Free automated Kundli, horoscope, compatibility, palm and tarot tools — labelled separately from a live Pandit consultation.',
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'Astrology tools · Pandit Talk',
    description: 'Free automated readings to start a reflection, separate from a live consultation.',
    url: '/tools',
  },
};

export default function Page() {
  return (
    <main id="main-content" className="page stack">
      <p className="eyebrow">Explore at your pace</p>
      <h1>Tools for a little perspective.</h1>
      <p className="lede">Automated readings can start a reflection. A conversation with a Pandit can take it further when No Timer opens — new bookings stay paused. These tools are labelled separately from a live consultation.</p>

      <section className="stack" aria-labelledby="free-tools-title">
        <div>
          <h2 id="free-tools-title">Start here</h2>
          <p className="expert-meta" id="free-tools-hint">Free automated tools. No booking required. Nothing here charges your wallet. Arrow keys move between tools; Escape blurs. Skip remains site-content.</p>
        </div>
        <LinkKeyboardGroup className="grid" role="list" aria-label="Free astrology tools" aria-describedby="free-tools-hint">
          {freeTools.map(([route, title, description]) => (
            <Link className="panel tool-card" role="listitem" key={route} href={'/tools/' + route} aria-label={`${title}: free to try`}>
              <p className="info-label">Free to try</p>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="text-link">Open {title}</span>
            </Link>
          ))}
        </LinkKeyboardGroup>
      </section>

      <section className="stack" aria-labelledby="paused-tools-title">
        <div>
          <h2 id="paused-tools-title">Detailed reports</h2>
          <p className="expert-meta" id="paused-tools-hint">New purchases are paused. You can still open reports you already own after signing in. Arrow keys move between report cards; Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
        </div>
        <LinkKeyboardGroup className="grid" role="list" aria-label="Paused detailed reports" aria-describedby="paused-tools-hint">
          {pausedTools.map(tool => (
            <Link className="panel tool-card tool-card-paused" role="listitem" key={tool.route} href={'/tools/' + tool.route} aria-label={`${tool.title}: new purchases paused`}>
              <p className="info-label">Purchases paused</p>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
              <span className="text-link">View details</span>
            </Link>
          ))}
        </LinkKeyboardGroup>
        <p className="sr-only" id="tools-paused-next-hint">Arrow keys move between sign-in, pricing, tools help and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Paused reports next steps" aria-describedby="tools-paused-next-hint">
          <Link className="button secondary" href="/login?returnTo=%2Freports&reason=auth">Sign in to open saved reports</Link>
          <Link className="text-link" href="/pricing">Pricing and pause terms →</Link>
          <Link className="text-link" href="/help/tools-and-readings">Tools help →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
        <aside
          className="notice offer-notice"
          aria-label="Report purchase updates"
          id="tools-paid-updates"
          tabIndex={-1}
        >
          <SiteIcon name="info" size={19} />
          <div className="offer-notice-body">
            <p><strong>Want a note when detailed reports open again?</strong></p>
            <NotifyOpenForm source="website_tools_index_paid" />
          </div>
        </aside>
        <FocusOnHash hash="#tools-paid-updates" targetId="tools-paid-updates" />
      </section>

      <aside className="notice" role="status">
        Automated tools offer reflection, not a guaranteed prediction. For personal guidance,{' '}
        <span className="sr-only" id="tools-guidance-hint">Arrow keys move between Pandits, draft and booking-update links. Escape blurs the focused link. Skip remains site-content.</span>
        <LinkKeyboardGroup as="span" aria-label="Tools index guidance links" aria-describedby="tools-guidance-hint">
          <Link href="/pandits">explore Pandits</Link>
          {' · '}
          <Link href="/guidance/start">prepare a private draft</Link>
          {' · '}
          <Link href="/how-it-works#booking-availability-how">Get a note when No Timer opens</Link>
        </LinkKeyboardGroup>
        . Free tools never charge your wallet; detailed purchases stay paused.
      </aside>
      <p className="sr-only" id="tools-footer-hint">Arrow keys move between guidance, draft, tools help and disclaimer. Escape blurs. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Tools page next steps" aria-describedby="tools-footer-hint">
        <Link className="button secondary" href="/guidance">Browse guidance topics</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="button secondary" href="/help/tools-and-readings">Tools help</Link>
        <Link className="text-link" href="/disclaimer">Disclaimer →</Link>
      </LinkKeyboardGroup>
    </main>
  );
}
