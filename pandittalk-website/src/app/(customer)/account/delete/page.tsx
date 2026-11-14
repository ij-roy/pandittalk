import type { Metadata } from 'next';
import { DeleteAccount } from '@/features/account/Account';
export const metadata: Metadata = { title: 'Delete account', description: 'Review what happens before closing your Pandit Talk account.' };
export default function Page(){return <DeleteAccount/>;}
