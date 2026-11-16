import type { Metadata } from 'next';
import styles from '@/features/account/customer.module.css';
import { HomeOverview } from '@/features/account/HomeOverview';

export const metadata: Metadata = {
  title: 'Your home',
  description: 'Your Pandit Talk home for bookings, wallet, reports and private preparation.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main id="main-content" className={`page stack ${styles.homePage}`}>
      <p className="eyebrow">Your Pandit Talk space</p>
      <h1>Welcome back.</h1>
      <p className="lede">Choose what you need today: continue a booking, find a Pandit, or look back at something you have saved.</p>
      <HomeOverview />
    </main>
  );
}
