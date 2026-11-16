import { WalletRecharge } from '@/features/wallet/WalletRecharge';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wallet recharge',
  description: 'Add coins to your Pandit Talk wallet through a secure, server-verified payment.',
  alternates: { canonical: '/wallet/recharge' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Wallet recharge · Pandit Talk',
    description: 'Choose a coin pack and add it to your Pandit Talk wallet securely.',
    url: '/wallet/recharge',
  },
};

export default function Page() { return <WalletRecharge />; }
