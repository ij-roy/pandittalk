import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { SiteIcon } from '@/components/site/SiteIcon';
import { InformationPage } from '../about/InformationPage';

export const metadata: Metadata = {
  title: 'Our approach',
  description: 'Direction without fear — human conversations, clear boundaries, and your choice of what comes next. New No Timer bookings stay paused on the website.',
  alternates: { canonical: '/our-approach' },
  openGraph: {
    title: 'Our approach · Pandit Talk',
    description: 'Direction without fear while new No Timer bookings stay paused — prepare a draft, explore Pandits, try free tools.',
    url: '/our-approach',
  },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow={<span lang="hi">Ek Soch. Ek Sach. Ek Koshish.</span>}
      title="Direction without fear."
      intro="Traditional wisdom can help someone frame a question, prepare for possibilities and choose a next step. It cannot guarantee an external outcome. New No Timer bookings are not open yet — exploring this page never charges coins."
    >
      <div className="info-columns">
        <section className="panel info-card">
          <p className="info-label">A person, a perspective</p>
          <h2>Human conversations</h2>
          <p>Real Pandits bring their own practice and perspective. Automated tools are marked clearly and do not pretend to be a personal consultation.</p>
        </section>
        <section className="panel info-card">
          <p className="info-label">Your choice matters</p>
          <h2>You choose what comes next.</h2>
          <p>You decide what to share, whether to continue and what to do next. Health, finance and legal-related topics remain spiritual guidance and are not a substitute for regulated professional advice.</p>
        </section>
      </div>

      <figure className="campaign-feature campaign-feature-tall">
        <Image src="/media/campaigns/predict-prepare-prosper-gen-z.webp" alt="Pandit Talk's Predict, Prepare, Prosper approach illustrated for a younger audience" width={1024} height={1536} sizes="(max-width: 700px) 100vw, 620px" />
        <figcaption>Predict. Prepare. Prosper. A visual introduction to the Pandit Talk approach.</figcaption>
      </figure>

      <section className="panel info-card">
        <p className="info-label">How we work</p>
        <h2>Three commitments we keep in view</h2>
        <ol>
          <li><strong>Room to explain.</strong> A useful conversation needs space for context, not a race against a clock.</li>
          <li><strong>Honest labelling.</strong> Profiles, reviews, tools and editorial writing say what they are — and what they are not.</li>
          <li><strong>Your control.</strong> Saved notes, drafts and sharing stay under your choices for a specific booking and Pandit.</li>
        </ol>
        <p className="sr-only" id="approach-story-hint">Arrow keys move between story, privacy and draft links. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Our approach story links" aria-describedby="approach-story-hint">
          <Link className="text-link" href="/how-it-works#your-story">How your story stays with you →</Link>
          <Link className="text-link" href="/privacy">Privacy policy →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>

      <section className="panel info-card">
        <p className="info-label">Where we draw the line</p>
        <h2>What this service is not</h2>
        <ul>
          <li>Not a medical, legal or financial advisory service.</li>
          <li>Not a guarantee of marriage, career, health or money outcomes.</li>
          <li>Not a place where automated tools are presented as a live Pandit.</li>
        </ul>
        <p className="sr-only" id="approach-boundary-hint">Arrow keys move between boundary links. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Our approach boundary links" aria-describedby="approach-boundary-hint">
          <Link className="text-link" href="/disclaimer">Read the disclaimer →</Link>
          <Link className="text-link" href="/trust">Trust and care →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>

      <p className="sr-only" id="approach-next-hint">Arrow keys move between Our approach next steps. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
      <LinkKeyboardGroup className="actions" aria-label="Our approach next steps" aria-describedby="approach-next-hint">
        <Link className="button" href="/pandits">Explore Pandits</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="button secondary" href="/how-it-works">How it works</Link>
        <Link className="text-link" href="/how-it-works#booking-availability-how">Get booking updates →</Link>
      </LinkKeyboardGroup>

      <aside className="notice offer-notice" aria-label="Get availability updates">
        <SiteIcon name="info" size={19} />
        <div className="offer-notice-body">
          <p>
            <strong>Want booking updates?</strong> Leave your email for a note when No Timer website booking opens.{' '}
            <span className="sr-only" id="approach-notify-hint">Arrow keys move between free tools and draft while you wait. Escape blurs. NotifyOpenForm still requires source. Skip remains site-content.</span>
            <LinkKeyboardGroup as="span" aria-label="Our approach notify alternatives" aria-describedby="approach-notify-hint">
              <Link href="/tools">Try free tools</Link>
              {' · '}
              <Link href="/guidance/start">Prepare a draft</Link>
            </LinkKeyboardGroup>
          </p>
          <NotifyOpenForm source="website_our_approach" />
        </div>
      </aside>
    </InformationPage>
  );
}
