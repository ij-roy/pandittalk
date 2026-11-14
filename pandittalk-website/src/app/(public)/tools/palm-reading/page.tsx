import type { Metadata } from 'next';
import ToolForm from '@/features/tools/ToolForm';

export const metadata: Metadata = {
  title: 'Palm reading',
  description: 'An AI interpretation of both palms for reflection.',
  alternates: { canonical: '/tools/palm-reading' },
};

export default function Page() {
  return <ToolForm kind="palm-reading" />;
}
