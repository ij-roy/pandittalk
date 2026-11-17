import { ExpertDirectory } from '@/features/experts/ExpertDirectory';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Pandits',
  description: 'Browse real Pandit introductions, languages and practice areas, then choose a scheduled session or Chat Now.',
  alternates: { canonical: '/pandits' },
};

export default function Page() {
  return (
    <main id="main-content" className="page pandits-page">
      <p className="eyebrow">Choose who to talk to</p>
      <h1>Find the right Pandit for your next conversation.</h1>
      <p className="lede pandits-lede">Compare practice areas, languages and experience. Open a profile to check live availability before you book.</p>
      <ExpertDirectory />
    </main>
  );
}
