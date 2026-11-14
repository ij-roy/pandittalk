import { readSession } from '@/features/auth/session';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { safeReturnTo } from '@/lib/api/security';
import CustomerNav from '@/features/account/CustomerNav';
import styles from '@/features/account/customer.module.css';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };
export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  if (!await readSession()) { const path = safeReturnTo((await headers()).get('x-customer-path')); redirect(`/login?returnTo=${encodeURIComponent(path)}&reason=auth`); }
  return <div className={styles.shell}><CustomerNav />{children}</div>;
}
