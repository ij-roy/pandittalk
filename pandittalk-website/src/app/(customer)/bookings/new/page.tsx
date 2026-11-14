import Link from 'next/link';
import type { Metadata } from 'next';
import { FocusMainHeading } from '@/components/site/FocusMainHeading';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { newBookingBlock } from '@/features/bookings/types';

export const metadata: Metadata = {
  title: 'New bookings paused',
  description: 'New No Timer bookings are not open yet on Pandit Talk. Prepare a draft or get notified — nothing is charged from this page.',
  robots: { index: false, follow: false },
};

function draftHrefFromParams(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  for (const key of ['expertId', 'area', 'format', 'step', 'review'] as const) {
    const value = params[key];
    if (typeof value === 'string' && value) query.set(key, value);
    else if (Array.isArray(value) && value[0]) query.set(key, value[0]);
  }
  const qs = query.toString();
  return qs ? `/guidance/start?${qs}` : '/guidance/start';
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const draftHref = draftHrefFromParams(params);

  return (
    <main id="main-content" className="page stack">
      <FocusMainHeading id="new-booking-title" />
      <Link className="text-link" href="/bookings">← Your bookings</Link>
      <p className="eyebrow">Booking availability</p>
      <h1 id="new-booking-title" tabIndex={-1}>New bookings are not open yet</h1>
      <p className="lede">{newBookingBlock}</p>
      <aside className="notice" role="status" aria-label="Booking availability">
        <p>
          <strong>This page does not create a booking or charge coins.</strong> Saved query details (Pandit, area, format) can still seed a private draft.
        </p>
        <NotifyOpenForm source="website_bookings_new" />
      </aside>
      <div className="panel stack">
        <h2>What you can do instead</h2>
        <p className="sr-only" id="new-booking-alt-hint">Arrow keys move between draft, bookings, free tools, booking updates and pricing. Escape blurs. NotifyOpenForm still requires source. Skip remains site-content. Opening this page does not charge coins.</p>
        <LinkKeyboardGroup className="actions" aria-label="New booking alternatives" aria-describedby="new-booking-alt-hint">
          <Link className="button" href={draftHref}>Prepare a draft instead</Link>
          <Link className="button secondary" href="/bookings">View existing bookings</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Get a note when booking opens →</Link>
          <Link className="text-link" href="/pricing">Pricing and service terms →</Link>
        </LinkKeyboardGroup>
      </div>
    </main>
  );
}
