import type { Metadata } from 'next';
import { PhoneChange } from '@/features/account/Account';
export const metadata: Metadata = { title: 'Change phone number', description: 'Update the Indian mobile number linked to your Pandit Talk account.' };
export default function Page(){return <PhoneChange/>;}
