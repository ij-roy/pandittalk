import type { Metadata } from 'next';
import PaidTool from '@/features/tools/PaidTool';

export const metadata: Metadata = {
  title: 'Monthly horoscope · purchases paused',
  description: 'Detailed monthly horoscope reports are paused for new purchases on Pandit Talk. Sign in for existing reports or leave your email for updates.',
  alternates: { canonical: '/tools/monthly-horoscope' },
};

export default function Page() {
  return <PaidTool title="Monthly horoscope" kind="monthly-horoscope" />;
}
