import type { Metadata } from 'next';
import View from "@/features/reports/Reports";

export const metadata: Metadata = { title: 'Reports', description: 'Open saved paid readings from Pandit Talk tools. Reopening never charges again; new detailed purchases stay paused.' };
export default function Page(){return <View/>;}
