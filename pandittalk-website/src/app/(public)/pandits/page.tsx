import { OfferNotice } from '@/components/site/OfferNotice';
import { ExpertDirectory } from '@/features/experts/ExpertDirectory';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Pandits',
  description: 'Browse real Pandit introductions, languages and practice areas. New No Timer bookings are not open yet — exploring never charges coins.',
  alternates: { canonical: '/pandits' },
};

export default function Page() {
  return (
    <main id="main-content" className="page pandits-page">
      <p className="eyebrow">Know the person</p>
      <h1>Explore Pandits while booking stays closed.</h1>
      <p className="lede pandits-lede">Real introductions, languages and practice areas. New No Timer bookings are not open yet — exploring a profile does not create a charge or notify the Pandit.</p>
      <OfferNotice compact source="website_pandits_directory" />
      <ExpertDirectory />
    </main>
  );
}
