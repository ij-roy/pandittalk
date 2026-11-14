import Link from 'next/link';
import { InformationPage } from '../../(public)/about/InformationPage';
import { FocusMainHeading } from '@/components/site/FocusMainHeading';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import type { Metadata } from 'next';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const deleted = params.deleted === '1' || params.deleted === 'true';
  if (deleted) {
    return {
      title: 'Account deleted',
      description: 'Your Pandit Talk account has been deactivated. Some operational records may remain under the retention policy.',
      robots: { index: false, follow: false },
      alternates: { canonical: '/delete-account' },
    };
  }
  return {
    title: 'Delete account',
    description: 'How to request account deletion and what records may be retained.',
    alternates: { canonical: '/delete-account' },
    openGraph: { title: 'Delete account · Pandit Talk', description: 'How to request account deletion and what records may be retained.', url: '/delete-account' },
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const deleted = params.deleted === '1' || params.deleted === 'true';

  if (deleted) {
    return (
      <InformationPage
        eyebrow="Account closed"
        title="Your account has been deleted"
        focusTitle
        intro="You are signed out. Profile details and photo are removed from the active account. Some transaction, booking and report records may still be retained under our privacy policy."
      >
        <FocusMainHeading id="info-page-title" />
        <p className="notice" role="status">
          Deactivation is complete for this browser session. If you still see a signed-in header, refresh the page or clear site data for pandittalk.com.
        </p>
        <section className="panel info-card">
          <h2>What you can do next</h2>
          <ul>
            <li>Explore public Pandit profiles and free tools without signing in.</li>
            <li>Contact support if a wallet balance, booking or report still needs follow-up.</li>
            <li>Read how retention works in the privacy policy.</li>
          </ul>
          <p className="sr-only" id="delete-done-actions-hint">Arrow keys move between next-step links including free tools and draft. Escape blurs the focused link. Skip remains site-content. NotifyOpenForm still requires source.</p>
          <LinkKeyboardGroup className="actions" aria-label="After account deletion" aria-describedby="delete-done-actions-hint">
            <Link className="button" href="/">Go to home</Link>
            <Link className="button secondary" href="/pandits">Explore Pandits</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="button secondary" href="/contact">Contact support</Link>
            <Link className="button secondary" href="/help">Help centre</Link>
            <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
            <Link className="text-link" href="/privacy">Privacy policy →</Link>
          </LinkKeyboardGroup>
        </section>
        <aside className="notice offer-notice" role="status" aria-label="Booking availability">
          <p>
            <strong>Want a note if you return later?</strong> This waitlist is for No Timer opening — not for restoring a deleted account.{' '}
            <span className="sr-only" id="delete-done-notify-hint">Arrow keys move between booking-how, tools and draft. Escape blurs. NotifyOpenForm still requires source. Skip remains site-content.</span>
            <LinkKeyboardGroup as="span" aria-label="After deletion booking alternatives" aria-describedby="delete-done-notify-hint">
              <Link href="/how-it-works#booking-availability-how">How booking will work</Link>
              {' · '}
              <Link href="/tools">Try free tools</Link>
              {' · '}
              <Link href="/guidance/start">Prepare a draft</Link>
            </LinkKeyboardGroup>
          </p>
          <NotifyOpenForm source="website_delete_account_done" helpText="Booking-open emails only — deletion is already complete. See our" />
        </aside>
        <aside className="notice">
          Creating a new account later uses a fresh sign-in. Previous deletion does not restore old profile data.
        </aside>
      </InformationPage>
    );
  }

  return (
    <InformationPage
      eyebrow="Your account controls"
      title="Delete your account"
      intro="Deletion is an authenticated action. It may revoke access to active sessions and remove or anonymise profile data while some operational records remain under the approved retention policy."
    >
      <section className="panel info-card">
        <h2>Before you continue</h2>
        <ul>
          <li>Sign in again if asked — deletion needs a fresh authentication.</li>
          <li>Review any active booking or wallet balance with support first.</li>
          <li>Understand that some transaction and report records may be retained.</li>
        </ul>
        <p className="sr-only" id="delete-prep-actions-hint">Arrow keys move between deletion, privacy, free tools and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="Account deletion preparation" aria-describedby="delete-prep-actions-hint">
          <Link className="button" href="/login?returnTo=%2Faccount%2Fdelete&reason=reauth">Sign in to open deletion</Link>
          <Link className="button secondary" href="/account/privacy">Privacy &amp; data controls</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates (separate) →</Link>
          <Link className="text-link" href="/privacy">Privacy policy →</Link>
        </LinkKeyboardGroup>
      </section>
      <aside className="notice offer-notice" role="status" aria-label="Booking availability">
        <p>
          <strong>Staying for now?</strong> You can still get a note when No Timer opens — separate from account deletion.{' '}
          <span className="sr-only" id="delete-stay-hint">Arrow keys move between booking-how, tools and draft. Escape blurs. NotifyOpenForm still requires source. Skip remains site-content.</span>
          <LinkKeyboardGroup as="span" aria-label="Delete account stay alternatives" aria-describedby="delete-stay-hint">
            <Link href="/how-it-works#booking-availability-how">How booking will work</Link>
            {' · '}
            <Link href="/tools">Try free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </p>
        <NotifyOpenForm source="website_delete_account" helpText="Booking-open emails only — not account deletion. See our" />
      </aside>
    </InformationPage>
  );
}
