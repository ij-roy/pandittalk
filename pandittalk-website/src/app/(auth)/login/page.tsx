import { AuthForm } from '@/features/auth/AuthForm';

export const metadata = {
  title: 'Sign in',
  description: 'Create an account or sign in to Pandit Talk with your Indian mobile number, Google or Apple.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AuthForm />;
}
