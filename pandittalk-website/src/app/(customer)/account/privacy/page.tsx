import Link from 'next/link';
import { FocusMainHeading } from '@/components/site/FocusMainHeading';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { privacyEmail } from '@/content/siteIdentity';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy & data',
  description: 'Manage profile details, private stories, cookies and account deletion on Pandit Talk.',
};

export default function Page() {
  return (
    <main id="main-content" className="page stack">
      <FocusMainHeading id="privacy-controls-title" />
      <Link className="text-link" href="/account">← Your account</Link>
      <div>
        <p className="eyebrow">Privacy controls</p>
        <h1 id="privacy-controls-title" tabIndex={-1}>Your data, your choices.</h1>
        <p className="lede">Manage your personal details and find help with the information saved to your account.</p>
      </div>

      <aside className="notice" role="status">
        <p>
          <strong>Booking and recharge stay paused on the website.</strong> These controls still apply to your signed-in profile, stories, cookies and deletion. New No Timer bookings do not open from this page.
        </p>
        <p className="sr-only" id="privacy-pause-actions-hint">Arrow keys move between pause-related links. Escape blurs the focused link. NotifyOpenForm still requires source. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" style={{ marginTop: 12 }} aria-label="While booking stays paused" aria-describedby="privacy-pause-actions-hint">
          <Link className="text-link" href="/bookings">View bookings →</Link>
          <Link className="text-link" href="/wallet">Open wallet →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Booking waitlist →</Link>
        </LinkKeyboardGroup>
      </aside>

      <section className="panel stack">
        <h2>Manage what you share</h2>
        <p>You can update your profile and edit or delete the private stories you have saved. You choose when to share a story with a Pandit for a booking — sharing never happens automatically.</p>
        <p className="sr-only" id="privacy-manage-actions-hint">Arrow keys move between account data controls. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Manage shared account data" aria-describedby="privacy-manage-actions-hint">
          <Link className="button secondary" href="/account/profile">Edit your profile</Link>
          <Link className="button secondary" href="/account/story">Manage your stories</Link>
          <Link className="button secondary" href="/account/notifications">Notification preferences</Link>
          <Link className="button secondary" href="/account/phone">Update phone number</Link>
          <Link className="button secondary" href="/reports">Saved reports</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>

      <section className="panel stack">
        <h2>Cookies and browser storage</h2>
        <p>A signed-in session cookie keeps you logged in on this browser. Guidance drafts and a short article-view guard use session storage on this device only — they are not optional marketing trackers.</p>
        <p className="sr-only" id="privacy-cookie-actions-hint">Arrow keys move between cookie, policy, tools and draft links. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Cookie and policy links" aria-describedby="privacy-cookie-actions-hint">
          <Link className="text-link" href="/cookie-policy">Cookie policy →</Link>
          <Link className="text-link" href="/privacy">Privacy policy →</Link>
          <Link className="text-link" href="/terms-and-conditions">Terms &amp; conditions →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>

      <section className="panel stack">
        <h2>Request help with your data</h2>
        <p>Profile details, uploads, conversations, wallet records and reports have different retention requirements. Contact our privacy team for help with access, removal or retention questions.</p>
        <p className="sr-only" id="privacy-help-actions-hint">Arrow keys move between privacy help, tools and draft. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Privacy help destinations" aria-describedby="privacy-help-actions-hint">
          <a
            className="button"
            href={`mailto:${privacyEmail}?subject=${encodeURIComponent('Privacy request')}&body=${encodeURIComponent('Page: /account/privacy\n\nWhat you need help with (access, correction, removal, retention):\n\nAccount phone or email (if useful):\n')}`}
          >
            Email privacy support <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens your email app)</span>
          </a>
          <Link className="text-link" href="/privacy">Read the privacy policy →</Link>
          <Link className="text-link" href="/cookie-policy">Cookie policy →</Link>
          <Link className="text-link" href="/grievance-redressal">Grievance redressal →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>

      <section className="panel stack">
        <h2>Closing your account</h2>
        <p>Account deletion deactivates your account and removes your profile details and photo. Some transaction, booking and report records may be retained.</p>
        <p className="sr-only" id="privacy-delete-actions-hint">Arrow keys move between deletion, tools and draft links. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Account deletion links" aria-describedby="privacy-delete-actions-hint">
          <Link className="button secondary" href="/account/delete">Review account deletion</Link>
          <Link className="text-link" href="/delete-account">Public deletion instructions →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
      </section>

      <aside className="notice offer-notice" role="status" aria-label="Booking availability">
        <p>
          <strong>Want a note when No Timer opens?</strong> This waitlist is separate from privacy requests.{' '}
          <span className="sr-only" id="privacy-notify-hint">Arrow keys move between booking-how, tools and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</span>
          <LinkKeyboardGroup as="span" aria-label="Account privacy booking alternatives" aria-describedby="privacy-notify-hint">
            <Link href="/how-it-works#booking-availability-how">How booking will work</Link>
            {' · '}
            <Link href="/tools">Try free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </p>
        <NotifyOpenForm source="website_account_privacy" helpText="Booking-open emails only — not privacy replies. See our" />
      </aside>
    </main>
  );
}
