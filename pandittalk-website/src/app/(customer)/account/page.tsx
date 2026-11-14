import type { Metadata } from 'next';
import View from "@/features/account/Account";

export const metadata: Metadata = { title: 'Your account', description: 'Profile, privacy and notification preferences. New No Timer bookings and recharge stay paused — account settings never open a consultation or charge coins.' };
export default function Page(){return <View/>;}
