import type { Metadata } from 'next';
import ToolForm from '@/features/tools/ToolForm';

export const metadata: Metadata = {
  title: 'Compatibility reading',
  description: 'Explore emotional connection, communication and harmony between two people.',
  alternates: { canonical: '/tools/compatibility' },
};

export default function Page() {
  return <ToolForm kind="compatibility" />;
}
