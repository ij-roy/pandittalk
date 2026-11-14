import type { Metadata } from 'next';
import ToolForm from '@/features/tools/ToolForm';

export const metadata: Metadata = {
  title: 'Tarot draw',
  description: 'Draw a Major Arcana card for a fresh perspective.',
  alternates: { canonical: '/tools/tarot' },
};

export default function Page() {
  return <ToolForm kind="tarot" />;
}
