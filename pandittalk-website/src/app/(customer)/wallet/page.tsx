import type { Metadata } from 'next';
import { Wallet } from '@/features/wallet/Wallet';

export const metadata: Metadata = { title: 'Wallet', description: 'View your balance, add coins securely, and review payments and refunds.' };
export default function Page(){return <Wallet/>;}

