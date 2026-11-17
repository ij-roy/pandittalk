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
      <header className={styles.homeIntro}>
        <p className="eyebrow">Your home</p>
        <h1>Welcome back.</h1>
        <p className="lede">Continue a booking or choose the next conversation that feels useful today.</p>
      </header>
      <HomeOverview />
    </main>
  );
}
