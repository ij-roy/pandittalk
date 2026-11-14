import { AuthForm } from '@/features/auth/AuthForm';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to Pandit Talk with your Indian mobile number or Google/Apple to open your private bookings, wallet and reports. New No Timer bookings stay paused.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AuthForm />;
}
