import type { Metadata } from 'next';
import ToolForm from '@/features/tools/ToolForm';

export const metadata: Metadata = {
  title: 'Daily horoscope',
  description: 'A free daily horoscope insight to reflect on the day. Open with ?sign=aries (or any zodiac sign) to pre-select.',
  alternates: { canonical: '/tools/horoscope' },
};

export default function Page() {
  return <ToolForm kind="horoscope" />;
}
