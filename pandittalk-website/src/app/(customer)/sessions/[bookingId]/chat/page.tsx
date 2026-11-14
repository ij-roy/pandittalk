import type { Metadata } from 'next';
import SessionPage from '@/features/sessions/SessionPage';

export const metadata: Metadata = {
  title: 'Chat consultation',
  description: 'Private chat room for an existing Pandit Talk consultation. This page is not indexed.',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  return <SessionPage id={bookingId} format="chat" />;
}
