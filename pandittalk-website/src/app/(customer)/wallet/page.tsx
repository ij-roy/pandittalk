import type { Metadata } from 'next';
import { Wallet } from '@/features/wallet/Wallet';

export const metadata: Metadata = { title: 'Wallet', description: 'View your coin balance, payments and refunds. New website recharge stays paused — opening wallet never starts a top-up.' };
export default function Page(){return <Wallet/>;}

