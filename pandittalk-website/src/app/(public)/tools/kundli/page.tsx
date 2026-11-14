import type { Metadata } from 'next';
import ToolForm from '@/features/tools/ToolForm';

export const metadata: Metadata = {
  title: 'Kundli birth chart',
  description: 'Explore your birth chart and planetary placements with an automated Kundli reading.',
  alternates: { canonical: '/tools/kundli' },
};

export default function Page() {
  return <ToolForm kind="kundli" />;
}
