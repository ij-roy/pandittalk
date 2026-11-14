import Link from 'next/link';
import { InformationPage } from '../../(public)/about/InformationPage';
import { ScrollableTableRegion } from '@/components/legal/ScrollableTableRegion';
import { EscapeBlurNotice } from '@/components/site/EscapeBlurNotice';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie policy',
  description: 'How Pandit Talk uses necessary session storage and what we do not invent as optional trackers.',
  alternates: { canonical: '/cookie-policy' },
  openGraph: { title: 'Cookie policy · Pandit Talk', description: 'How Pandit Talk uses necessary session storage and what we do not invent as optional trackers.', url: '/cookie-policy' },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="Cookie policy"
      title="Storage should have a purpose."
      intro="We only keep what is needed for the website to work securely, and we will not invent optional trackers that are not actually present."
    >
      <section className="panel info-card">
        <h2>Necessary storage</h2>
        <p>Session cookies support sign-in and protect authenticated actions. Without them, account, wallet and booking pages cannot stay secure.</p>
        <ScrollableTableRegion label="Cookie inventory">
          <table className="legal-table">
            <caption className="sr-only">Necessary cookies and browser storage used by Pandit Talk</caption>
            <thead>
              <tr><th scope="col">Name / type</th><th scope="col">Purpose</th><th scope="col">Duration</th></tr>
            </thead>
            <tbody>
              <tr><td>Session / auth cookie</td><td>Keep you signed in and protect authenticated actions</td><td>Session or short-lived renewal</td></tr>
              <tr><td>CSRF / security token</td><td>Protect form submissions and API actions</td><td>Session</td></tr>
              <tr><td>Browser session storage (guidance draft)</td><td>Preserve an unfinished conversation draft on this device (<code>pandittalk.guidance.draft</code>)</td><td>Until you clear site data or close the tab</td></tr>
              <tr><td>Browser session storage (article event guard)</td><td>Avoid double-counting a view or read while you stay on the same tab</td><td>Until you clear site data or close the tab</td></tr>
            </tbody>
          </table>
        </ScrollableTableRegion>
      </section>
      <section className="panel info-card">
        <h2>Optional analytics or marketing</h2>
        <p>Optional analytics and marketing storage must be inventoried and consented in the deployed environment. This site does not claim optional trackers are enabled.</p>
      </section>
      <section className="panel info-card">
        <h2>How to clear storage</h2>
        <p>Use your browser controls to clear cookies and site data for pandittalk.com. Signing out from <Link href="/account">Your account</Link> ends the authenticated session cookie on this browser. Guidance drafts live only in this browser tab&apos;s session storage and are not shared across devices.</p>
        <p className="expert-meta" role="status">If you are signed out, open Your account after signing in to use the privacy controls. Clearing site data also removes any local guidance draft on this device.</p>
        <p className="sr-only" id="cookie-storage-actions-hint">Arrow keys move between storage, privacy, tools and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Cookie and privacy destinations" aria-describedby="cookie-storage-actions-hint">
          <Link className="button secondary" href="/account/privacy">Signed-in privacy controls</Link>
          <Link className="button secondary" href="/login?returnTo=%2Faccount%2Fprivacy&reason=auth">Sign in for privacy controls</Link>
          <Link className="button secondary" href="/account">Sign out from account</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
          <Link className="text-link" href="/help/account-access">Account access help →</Link>
          <Link className="text-link" href="/privacy">Privacy policy →</Link>
        </LinkKeyboardGroup>
      </section>
      <aside className="notice offer-notice" role="status" aria-label="Booking availability">
        <p>
          <strong>Want a note when No Timer opens?</strong> This waitlist is separate from cookie or privacy questions.{' '}
          <span className="sr-only" id="cookie-notify-hint">Arrow keys move between booking-how, tools and draft. Escape blurs. NotifyOpenForm still requires source.</span>
          <LinkKeyboardGroup as="span" aria-label="Cookie policy booking pause links" aria-describedby="cookie-notify-hint">
            <Link href="/how-it-works#booking-availability-how">How booking will work</Link>
            {' · '}
            <Link href="/tools">Try free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </p>
        <NotifyOpenForm source="website_cookie_policy" helpText="Booking-open emails only — separate from cookie or privacy replies. See our" />
      </aside>
      <p className="sr-only" id="cookie-footer-hint">Arrow keys move between cookie policy follow-up links. Escape blurs. Skip remains site-content.</p>
      <EscapeBlurNotice className="notice" role="status" aria-label="Cookie policy follow-up">
        Questions about cookies or privacy?{' '}
        <LinkKeyboardGroup as="span" aria-label="Cookie policy follow-up links" aria-describedby="cookie-footer-hint">
          <Link href="/privacy">Read the privacy policy</Link>
          {' · '}
          <Link href="/tools">Try free tools</Link>
          {' · '}
          <Link href="/guidance/start">Prepare a draft</Link>
          {' · '}
          <Link href="/how-it-works#booking-availability-how">Get booking updates</Link>
          {' · '}
          <Link href="/contact">Contact support</Link>
        </LinkKeyboardGroup>
        {' '}Press Escape to leave this notice.
      </EscapeBlurNotice>
    </InformationPage>
  );
}
