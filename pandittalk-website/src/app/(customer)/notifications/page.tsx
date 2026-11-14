import type { Metadata } from 'next';
import View from "@/features/notifications/Notifications";

export const metadata: Metadata = { title: 'Notifications', description: 'Booking and session updates in one place.', robots: { index: false, follow: false } };
export default function Page(){return <View/>;}
