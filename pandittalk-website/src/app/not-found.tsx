import Link from 'next/link';
import type { Metadata } from 'next';
import { GoBackButton } from '@/components/site/GoBackButton';
import { FocusMainHeading } from '@/components/site/FocusMainHeading';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { supportEmail } from '@/content/siteIdentity';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'This Pandit Talk page could not be found. Try home, Pandits, help, or contact support.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main id="main-content" className="page stack" style={{ maxWidth: 720 }}>
      <FocusMainHeading id="not-found-title" />
      <p className="eyebrow">Page not found</p>
      <h1 id="not-found-title" tabIndex={-1}>This page is not here.</h1>
      <p className="lede">
        The link may be old, or the page may have moved. Nothing is wrong with your account — try one of these useful places instead.
      </p>
      <p className="sr-only" id="not-found-primary-hint">Arrow keys move between recovery actions. Escape blurs the focused control. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Page not found recovery" aria-describedby="not-found-primary-hint">
        <Link className="button" href="/">Go to home</Link>
        <GoBackButton />
        <Link className="button secondary" href="/pandits">Explore Pandits</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="button secondary" href="/help">Help centre</Link>
      </LinkKeyboardGroup>
      <nav aria-label="Popular destinations" aria-describedby="not-found-dest-hint">
        <p className="sr-only" id="not-found-dest-hint">Arrow keys move between destination links. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup aria-label="Popular destinations list" aria-describedby="not-found-dest-hint">
          <ul className="link-list">
            <li><Link href="/guidance">Find guidance by topic</Link></li>
            <li><Link href="/tools">Try an astrology tool</Link></li>
            <li><Link href="/articles">Read the journal</Link></li>
            <li><Link href="/how-it-works">How conversations work</Link></li>
            <li><Link href="/how-it-works#booking-availability-how">Get a note when booking opens</Link></li>
            <li><Link href="/login">Sign in to your account</Link></li>
            <li><Link href="/contact">Contact support</Link></li>
          </ul>
        </LinkKeyboardGroup>
      </nav>
      <aside className="notice" role="status" aria-label="Booking availability">
        <p>
          New No Timer bookings are not open yet — a missing page does not create or cancel a booking.
          Still stuck? Email{' '}
          <a href={`mailto:${supportEmail}?subject=${encodeURIComponent('Broken link on Pandit Talk')}`}>
            {supportEmail}
            <span className="sr-only"> (opens your email app)</span>
          </a>{' '}
          from the <Link href="/contact">contact page</Link> with the URL you expected.
          {' '}
          <span className="sr-only" id="not-found-notify-hint">Arrow keys move between booking-how, tools and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</span>
          <LinkKeyboardGroup as="span" aria-label="404 booking alternatives" aria-describedby="not-found-notify-hint">
            <Link href="/how-it-works#booking-availability-how">How booking will work</Link>
            {' · '}
            <Link href="/tools">Try free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </p>
        <div className="notify-inline" style={{ marginTop: 12 }}>
          <NotifyOpenForm source="website_404" />
        </div>
      </aside>
    </main>
  );
}
