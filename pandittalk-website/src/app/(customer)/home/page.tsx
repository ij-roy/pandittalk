import type { Metadata } from 'next';
import styles from '@/features/account/customer.module.css';
import { HomeOverview } from '@/features/account/HomeOverview';
import { fetchArticles } from '@/lib/articles/api';

export const metadata: Metadata = {
  title: 'Your home',
  description: 'Your Pandit Talk home for bookings, wallet, reports and private preparation.',
  robots: { index: false, follow: false },
};

export default async function Page() {
  const articles = await fetchArticles({ limit: 12 });
  return (
    <main id="main-content" className={`page stack ${styles.homePage}`}>
      <header className={styles.homeIntro}>
        <p className="eyebrow">Your home</p>
        <h1>Welcome back.</h1>
        <p className="lede">Continue a booking or choose the next conversation that feels useful today.</p>
      </header>
        <HomeOverview initialArticles={articles} />
    </main>
  );
}
