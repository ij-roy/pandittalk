import Link from 'next/link';
import type { Metadata } from 'next';
import { InformationPage } from '../about/InformationPage';
import { EscapeBlurNotice } from '@/components/site/EscapeBlurNotice';
import { FocusOnHash } from '@/components/site/FocusOnHash';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { SiteIcon } from '@/components/site/SiteIcon';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'New No Timer bookings are not open yet. Browse Pandits, prepare a draft, and see how a conversation will work once terms are ready.',
  alternates: { canonical: '/how-it-works' },
  openGraph: {
    title: 'How it works · Pandit Talk',
    description: 'New No Timer bookings are not open yet. Browse Pandits, prepare a draft, and see how a conversation will work once terms are ready.',
    url: '/how-it-works',
  },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="A clear path"
      title="How a conversation works"
      intro="New No Timer bookings are not open yet. You can browse Pandits and prepare a private draft now. Sign in for existing bookings, wallet and reports. When bookings open, you will review the person, topic, format, scope and total before any payment."
    >
      <ol className="how-steps">
        <li className="panel info-card">
          <span className="info-step" aria-hidden="true">01</span>
          <h2>Find the right person.</h2>
          <p>Read a Pandit&apos;s own introduction and listed practice. You do not need a perfect question to begin.</p>
          <p className="sr-only" id="how-find-hint">Arrow keys move between find-step links. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="How it works find step" aria-describedby="how-find-hint">
            <Link className="button" href="/pandits">Explore Pandits</Link>
            <Link className="text-link" href="/for-pandits">For practitioners →</Link>
            <Link className="text-link" href="/trust#how-to-check">How to check a claim →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
          </LinkKeyboardGroup>
        </li>
        <li className="panel info-card">
          <span className="info-step" aria-hidden="true">02</span>
          <h2>Prepare your question.</h2>
          <p>Use the guidance flow to capture the area, format and notes you want to bring. Preparing a draft does not create a booking or share anything with a Pandit.</p>
          <p className="sr-only" id="how-prepare-hint">Arrow keys move between prepare-step links. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="How it works prepare step" aria-describedby="how-prepare-hint">
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/help/preparing-a-draft">Draft help →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
          </LinkKeyboardGroup>
        </li>
        <li className="panel info-card">
          <span className="info-step" aria-hidden="true">03</span>
          <h2>Understand the commitment.</h2>
          <p>New No Timer bookings are not open yet. Pricing, completion, breaks and interruption terms are being finalized. Existing bookings keep their agreed terms.</p>
          <p className="sr-only" id="how-pricing-hint">Arrow keys move between pricing-step links. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="How it works pricing step" aria-describedby="how-pricing-hint">
            <Link className="text-link" href="/pricing">Read pricing and availability →</Link>
            <Link className="text-link" href="/pricing-policy">Pricing policy →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </li>
        <li className="panel info-card">
          <span className="info-step" aria-hidden="true">04</span>
          <h2>Talk, then choose a next step.</h2>
          <p>For existing bookings only: join chat, audio or video from an eligible booking. Ending the conversation remains your choice. New No Timer bookings are not open yet. Automated tools are labelled separately from a human conversation.</p>
          <p className="sr-only" id="how-join-hint">Arrow keys move between join-step links including free tools and draft. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="How it works join step" aria-describedby="how-join-hint">
            <Link className="button secondary" href="/login?returnTo=%2Fbookings&reason=auth">Sign in to view bookings</Link>
            <Link className="text-link" href="/help/first-consultation">First-consultation guide (bookings paused) →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </li>
      </ol>

      <section className="panel info-card" id="formats">
        <p className="info-label">Formats</p>
        <h2>Chat, audio or video — when a booking allows it</h2>
        <p>Eligible existing bookings can open chat, audio or video from the customer session pages. Camera and microphone permissions apply only on audio or video sessions. If a session disconnects, use the reconnect help for that format rather than starting a new unpaid booking.</p>
        <p className="sr-only" id="how-format-hint">Arrow keys move between format help, free tools and draft. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="How it works format help" aria-describedby="how-format-hint">
          <Link className="text-link" href="/help/joining-audio-video">Joining audio or video →</Link>
          <Link className="text-link" href="/help/chat-reconnect">Chat reconnect →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>

      <section className="panel info-card" id="your-story">
        <p className="info-label">Your words stay yours</p>
        <h2>How your story stays with you</h2>
        <p>When you are signed in, you can save a private note, edit it, delete it, or start fresh. Sharing is always your choice for a specific booking and Pandit — nothing is sent until you decide.</p>
        <p className="sr-only" id="how-story-hint">Arrow keys move between story, free tools and draft. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="How it works story links" aria-describedby="how-story-hint">
          <Link className="button secondary" href="/login?returnTo=%2Faccount%2Fstory&reason=auth">Sign in to manage your story</Link>
          <Link className="text-link" href="/tools">Try a free tool first →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>

      <section className="panel info-card" id="after-conversation">
        <p className="info-label">Afterwards</p>
        <h2>Reviews, reports and follow-up</h2>
        <p>When a booking is eligible, you may leave a review or open a report from your account. Reviews appear publicly only after eligibility checks. If something went wrong with payment or completion, keep your booking or payment reference and contact support.</p>
        <p className="sr-only" id="how-after-hint">Arrow keys move between after-conversation links. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="How it works after conversation" aria-describedby="how-after-hint">
          <Link className="text-link" href="/help/refunds-and-complaints">Refunds and complaints →</Link>
          <Link className="text-link" href="/trust">Trust and care →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>

      <FocusOnHash hash="#booking-availability-how" targetId="booking-availability-how" />
      <EscapeBlurNotice
        className="notice offer-notice"
        aria-label="Get availability updates"
        id="booking-availability-how"
      >
        <SiteIcon name="info" size={19} />
        <div className="offer-notice-body">
          <p>
            <strong>Want a note when No Timer opens?</strong> Leave your email and we will write when conversations can begin. Press Escape to leave this notice.{' '}
            <span className="sr-only" id="how-notify-hint">Arrow keys move between free tools and draft while you wait. Escape blurs. NotifyOpenForm still requires source. Skip remains site-content.</span>
            <LinkKeyboardGroup as="span" aria-label="How it works notify alternatives" aria-describedby="how-notify-hint">
              <Link href="/tools">Try free tools</Link>
              {' · '}
              <Link href="/guidance/start">Prepare a draft</Link>
            </LinkKeyboardGroup>
          </p>
          <NotifyOpenForm source="website_how_it_works" />
        </div>
      </EscapeBlurNotice>
    </InformationPage>
  );
}
