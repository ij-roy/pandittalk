import type { Metadata } from 'next';
import { Preferences } from '@/features/account/Account';
export const metadata: Metadata = { title: 'Notification preferences', description: 'Choose which Pandit Talk updates you want to receive.' };
export default function Page(){return <Preferences/>;}
