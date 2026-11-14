import type { Metadata } from 'next';
import GuidanceFlow from '@/features/guidance/GuidanceFlow';

export const metadata: Metadata = {
  title: 'Prepare a private draft',
  description: 'Capture the area, format and notes you want to bring later. New No Timer bookings are not open yet — this saves a private draft only and never charges coins.',
  alternates: { canonical: '/guidance/start' },
  openGraph: {
    title: 'Prepare a private draft · Pandit Talk',
    description: 'Save a private draft — area, format and notes. Preparing a draft does not create a booking or charge.',
    url: '/guidance/start',
  },
};

export default function Page() {
  return <GuidanceFlow />;
}
