import type { Metadata } from 'next';
import StoryContext from '@/features/account/StoryContext';
export const metadata: Metadata = {
  title: 'Your story',
  description: 'Save private context for your next Pandit conversation. Nothing is shared until you choose a booking.',
  robots: { index: false, follow: false },
};
export default function Page(){return <StoryContext/>;}
