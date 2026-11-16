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
      <p className="eyebrow">Know the person</p>
      <h1>Meet the people behind the conversations.</h1>
      <p className="lede pandits-lede">Read real introductions, languages and practice areas. Open a profile to see the live schedule or check Chat Now; the exact duration and total appear before confirmation.</p>
      <ExpertDirectory />
    </main>
  );
}
