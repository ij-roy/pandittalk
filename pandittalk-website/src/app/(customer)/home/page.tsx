import type { Metadata } from 'next';
import Link from 'next/link';
import { EscapeBlurNotice } from '@/components/site/EscapeBlurNotice';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { HomeOverview } from '@/features/account/HomeOverview';

export const metadata: Metadata = {
  title: 'Your home',
  description: 'Your Pandit Talk home for existing bookings, wallet, reports and private preparation.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main id="main-content" className="page stack">
      <p className="eyebrow">Your Pandit Talk home</p>
      <h1>Welcome back.</h1>
      <p className="lede">Pick up an existing booking, review saved reports, manage your account, or choose a Pandit for a scheduled session or Chat Now.</p>

      <HomeOverview />

      <p className="sr-only" id="home-tiles-hint">Arrow keys move between home shortcuts. Home and End jump to the first or last. Escape blurs the focused card. Skip remains site-content.</p>
      <LinkKeyboardGroup className="grid home-tiles" role="navigation" aria-label="Your Pandit Talk shortcuts" aria-describedby="home-tiles-hint">
        <Link className="panel" href="/bookings">
          <h2>Bookings</h2>
          <p>See your scheduled sessions and Chat Now conversations.</p>
          <span className="text-link">Open bookings</span>
        </Link>
        <Link className="panel" href="/wallet">
          <h2>Wallet</h2>
          <p>Check your balance, add coins securely, and review payment history.</p>
          <span className="text-link">Manage wallet</span>
        </Link>
        <Link className="panel" href="/reports">
          <h2>Reports</h2>
          <p>Open saved paid readings. Existing reports stay here while new purchases are unavailable.</p>
          <span className="text-link">Open reports</span>
        </Link>
        <Link className="panel" href="/notifications">
          <h2>Updates</h2>
          <p>Booking and session notices in one place. Quiet when there is nothing new.</p>
          <span className="text-link">Open notifications</span>
        </Link>
        <Link className="panel" href="/account/story">
          <h2>Your story</h2>
          <p>Edit, delete or start fresh with private context you choose to keep.</p>
          <span className="text-link">Manage story</span>
        </Link>
        <Link className="panel" href="/account">
          <h2>Account</h2>
          <p>Profile, privacy and notification preferences.</p>
          <span className="text-link">Manage account</span>
        </Link>
        <Link className="panel" href="/pandits">
          <h2>Explore Pandits</h2>
          <p>Read introductions and choose a scheduled session or Chat Now.</p>
          <span className="text-link">Browse directory</span>
        </Link>
        <Link className="panel" href="/guidance/start">
          <h2>Prepare a draft</h2>
          <p>Write an optional note to bring into a confirmed conversation.</p>
          <span className="text-link">Start a draft</span>
        </Link>
        <Link className="panel" href="/tools">
          <h2>Free tools</h2>
          <p>Try daily horoscope, kundli, tarot and other free readings separately from a conversation.</p>
          <span className="text-link">Open free tools</span>
        </Link>
      </LinkKeyboardGroup>

      <EscapeBlurNotice role="status">
        <strong>Keep your balance ready for a booking.</strong> Add coins from your wallet when you need them. Press Escape to leave this notice.{' '}
        <span className="sr-only" id="home-wallet-pause-hint">Arrow keys move between wallet, recharge, tools and optional notes. Escape blurs. Skip remains site-content.</span>
        <LinkKeyboardGroup as="span" aria-label="Customer home wallet links" aria-describedby="home-wallet-pause-hint">
          <Link href="/wallet/recharge">Add coins</Link>
          {' · '}
          <Link href="/wallet">Open wallet</Link>
          {' · '}
          <Link href="/tools">Try free tools</Link>
          {' · '}
          <Link href="/guidance/start">Prepare a draft</Link>
        </LinkKeyboardGroup>
        .
      </EscapeBlurNotice>
    </main>
  );
}
