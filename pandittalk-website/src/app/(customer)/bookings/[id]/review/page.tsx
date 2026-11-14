import { BookingDetail } from '@/features/bookings/BookingViews';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leave a review',
  description: 'Share feedback about your Pandit Talk consultation.',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetail id={id} reviewOnly />;
}
