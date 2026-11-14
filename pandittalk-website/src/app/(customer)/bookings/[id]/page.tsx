import { BookingDetail } from '@/features/bookings/BookingViews';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Booking',
  description: 'Your Pandit Talk booking details, session access and cancellation options.',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetail id={id} />;
}
