import type { Metadata } from 'next';
import ForPanditsClient from './ForPanditsClient';

export const metadata: Metadata = {
  title: 'For Pandits',
  description: 'Apply to bring your practice into Pandit Talk, or open the practitioner dashboard if you are already approved.',
  alternates: { canonical: '/for-pandits' },
  openGraph: {
    title: 'For Pandits · Pandit Talk',
    description: 'Apply to bring your practice into Pandit Talk, or open the practitioner dashboard if you are already approved.',
    url: '/for-pandits',
  },
};

export default function Page() {
  return <ForPanditsClient />;
}
