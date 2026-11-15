import type { Metadata } from 'next';
import Link from 'next/link';
import { EscapeBlurNotice } from '@/components/site/EscapeBlurNotice';
import { OfferNotice } from '@/components/site/OfferNotice';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { HomeOverview } from '@/features/account/HomeOverview';
import { availabilityCopy } from '@/content/availability';

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
      <p className="lede">Pick up an existing booking, review saved reports, manage your account, or prepare for a future conversation. {availabilityCopy.publicStatus}</p>

      <HomeOverview />

      <p className="sr-only" id="home-tiles-hint">Arrow keys move between home shortcuts. Home and End jump to the first or last. Escape blurs the focused card. Skip remains site-content.</p>
      <LinkKeyboardGroup className="grid home-tiles" role="navigation" aria-label="Your Pandit Talk shortcuts" aria-describedby="home-tiles-hint">
        <Link className="panel" href="/bookings">
          <h2>Bookings</h2>
          <p>See existing conversations. New conversations will appear here when they open.</p>
          <span className="text-link">Open bookings</span>
        </Link>
        <Link className="panel" href="/wallet">
          <h2>Wallet</h2>
          <p>Check your balance and transaction history. Website top-ups are not available yet.</p>
          <span className="text-link">Open wallet</span>
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
          <p>Read introductions and prepare your next conversation while new conversations are opening soon.</p>
          <span className="text-link">Browse directory</span>
        </Link>
        <Link className="panel" href="/guidance/start">
          <h2>Prepare a draft</h2>
          <p>Write the question you want to bring when conversations open.</p>
          <span className="text-link">Start a draft</span>
        </Link>
        <Link className="panel" href="/tools">
          <h2>Free tools</h2>
          <p>Try daily horoscope, kundli, tarot and other free readings while booking stays closed.</p>
          <span className="text-link">Open free tools</span>
        </Link>
      </LinkKeyboardGroup>

      <OfferNotice compact source="website_customer_home" />
      <EscapeBlurNotice role="status">
        <strong>Website top-ups are not available yet.</strong> Existing bookings and wallet records remain available. Press Escape to leave this notice.{' '}
        <span className="sr-only" id="home-wallet-pause-hint">Arrow keys move between recharge, wallet, tools, draft and booking updates. Escape blurs. OfferNotice still requires source. Skip remains site-content.</span>
        <LinkKeyboardGroup as="span" aria-label="Customer home wallet pause links" aria-describedby="home-wallet-pause-hint">
          <Link href="/wallet/recharge">Recharge updates</Link>
          {' · '}
          <Link href="/wallet">Open wallet</Link>
          {' · '}
          <Link href="/tools">Try free tools</Link>
          {' · '}
          <Link href="/guidance/start">Prepare a draft</Link>
          {' · '}
          <Link href="/how-it-works#booking-availability-how">Booking updates</Link>
        </LinkKeyboardGroup>
        .
      </EscapeBlurNotice>
    </main>
  );
}
