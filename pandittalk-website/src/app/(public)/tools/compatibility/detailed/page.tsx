import type { Metadata } from 'next';
import PaidTool from '@/features/tools/PaidTool';

export const metadata: Metadata = {
  title: 'Detailed compatibility · purchases paused',
  description: 'Detailed compatibility reports are paused for new purchases on Pandit Talk. Sign in for existing reports or leave your email for updates.',
  alternates: { canonical: '/tools/compatibility/detailed' },
};

export default function Page() {
  return <PaidTool title="Detailed compatibility" />;
}
