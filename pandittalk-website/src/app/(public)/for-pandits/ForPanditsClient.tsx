'use client';

import { DASHBOARD_URL } from '@/lib/articles/site';
import Link from 'next/link';
import { useEffect } from 'react';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import PanditApplicationForm from '@/features/pandits/PanditApplicationForm';

function focusApplication() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const target = document.getElementById('apply');
  target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  window.setTimeout(() => {
    const field = target?.querySelector<HTMLElement>('input, textarea, button, select');
    (field || target)?.focus({ preventScroll: true });
  }, reduce ? 0 : 200);
}

export default function ForPanditsClient() {
  useEffect(() => {
    function maybeFocus() {
      if (new URLSearchParams(location.search).get('apply') !== '1' && location.hash !== '#apply') return;
      focusApplication();
    }
    maybeFocus();
    window.addEventListener('pageshow', maybeFocus);
    return () => window.removeEventListener('pageshow', maybeFocus);
  }, []);

  useEffect(() => {
    const onHash = () => {
      if (location.hash === '#apply') focusApplication();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <main id="main-content" className="page stack" style={{ maxWidth: 920 }}>
      <p className="eyebrow">For Pandits</p>
      <h1>Bring your practice into a careful conversation.</h1>
      <p className="lede">Practitioner suitability, identity evidence, conduct expectations and application intake are reviewed before any profile is published.</p>
      <aside className="notice" role="status" aria-label="Practitioner application information">
        <p>
          <strong>Applications are open.</strong> Submitting here does not publish a profile or create seeker bookings. Approved practitioners can manage availability, presence and timed conversations from the practitioner workspace.
        </p>
        <NotifyOpenForm
          source="website_for_pandits"
          submitLabel="Notify me about practitioner updates"
          helpText="Optional email list for practitioner onboarding notes — separate from customer booking-open mail. See our"
        />
      </aside>

      <div className="info-columns">
        <section className="panel info-card">
          <p className="info-label">Already approved?</p>
          <h2>Open your dashboard</h2>
          <p>Approved practitioners manage availability, presence and timed conversations in the practitioner workspace. The public website cannot sign you into the dashboard.</p>
          <p className="sr-only" id="for-pandits-dashboard-hint">Arrow keys move between dashboard, trust, tools, draft and support links. Escape blurs the focused control. Skip remains site-content. NotifyOpenForm still requires source.</p>
          <LinkKeyboardGroup className="actions" aria-label="Practitioner dashboard next steps" aria-describedby="for-pandits-dashboard-hint">
            <a className="button" href={DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
              Open practitioner dashboard <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <Link className="button secondary" href="/trust">Trust standard</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
            <Link className="text-link" href="/contact">Contact support about an application →</Link>
          </LinkKeyboardGroup>
          <p className="expert-meta" style={{ marginTop: 12 }}>
            Use the same credentials issued after approval. Still waiting on review? Email support with your application reference.
          </p>
        </section>
        <section className="panel info-card">
          <p className="info-label">New here?</p>
          <h2>Apply to join</h2>
          <p>Tell us about your practice. Applications are reviewed before any public profile is created.</p>
          <p className="sr-only" id="for-pandits-apply-hint">Arrow keys move between Start an application, trust and how-it-works. Escape blurs. NotifyOpenForm still requires source.</p>
          <LinkKeyboardGroup className="actions" aria-label="Start Pandit application" aria-describedby="for-pandits-apply-hint">
            <Link className="button secondary" href="#apply" onClick={event => { event.preventDefault(); history.replaceState(null, '', '#apply'); focusApplication(); }}>Start an application</Link>
            <Link className="text-link" href="/trust">Read our trust standard →</Link>
            <Link className="text-link" href="/how-it-works">How conversations work →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </section>
      </div>

      <section className="panel info-card">
        <p className="info-label">Before you apply</p>
        <h2>What review looks for</h2>
        <ul>
          <li>A clear description of your practice areas and languages.</li>
          <li>Identity and suitability evidence requested during intake.</li>
          <li>Willingness to follow conduct expectations: respectful listening, confidentiality, and honest claims.</li>
          <li>No invented testimonials or outcome guarantees on a public profile.</li>
        </ul>
        <p className="expert-meta">Submitting an application does not publish a profile or create customer bookings. Publication and customer access follow the separate review process.</p>
        <p className="sr-only" id="for-pandits-before-hint">Arrow keys move between trust, how-it-works and contact. Escape blurs the focused link.</p>
        <LinkKeyboardGroup className="actions" aria-label="Before you apply next steps" aria-describedby="for-pandits-before-hint">
          <Link className="text-link" href="/trust">Read our trust standard →</Link>
          <Link className="text-link" href="/how-it-works">How conversations work →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/contact">Ask about applying →</Link>
        </LinkKeyboardGroup>
      </section>

      <section className="panel info-card">
        <p className="info-label">After you apply</p>
        <h2>What happens next</h2>
        <ol>
          <li>We acknowledge your application and may ask for clarifying details.</li>
          <li>Review covers suitability, evidence and conduct alignment — not popularity metrics.</li>
          <li>If approved, you receive dashboard access and profile publishing steps separately.</li>
        </ol>
        <p className="sr-only" id="for-pandits-after-hint">Arrow keys move between contact, trust and jump-to-application. Escape blurs the focused link.</p>
        <LinkKeyboardGroup className="actions" aria-label="After you apply next steps" aria-describedby="for-pandits-after-hint">
          <Link className="text-link" href="/contact">Questions about an application →</Link>
          <Link className="text-link" href="/trust">Trust standard →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="#apply" onClick={event => { event.preventDefault(); history.replaceState(null, '', '#apply'); focusApplication(); }}>Jump to application →</Link>
        </LinkKeyboardGroup>
      </section>

      <section className="panel stack" id="apply" tabIndex={-1} aria-labelledby="apply-heading" onKeyDown={event => {
        if (event.key !== 'Escape') return;
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }}>
        <h2 id="apply-heading">Application</h2>
        <p className="expert-meta">Share accurate details only. Do not include private customer information or unverified claims. Submitting does not publish a public profile until review is complete.</p>
        <PanditApplicationForm />
      </section>
    </main>
  );
}
