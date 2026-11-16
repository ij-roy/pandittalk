import type { Metadata } from 'next';
import { BookingFlow } from '@/features/bookings/BookingFlow';

export const metadata: Metadata = {
  title: 'Book a consultation',
  description: 'Choose a timed Pandit Talk consultation with a live quote and available time.',
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const expertId = typeof params.expertId === 'string' ? params.expertId : Array.isArray(params.expertId) ? params.expertId[0] : undefined;
  const modeValue = typeof params.mode === 'string' ? params.mode : Array.isArray(params.mode) ? params.mode[0] : undefined;
  return <BookingFlow expertId={expertId} mode={modeValue === 'chat-now' ? 'chat-now' : 'scheduled'} />;
}
