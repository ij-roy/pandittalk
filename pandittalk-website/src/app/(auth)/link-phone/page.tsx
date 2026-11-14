import { permanentRedirect } from 'next/navigation';
import { safeReturnTo } from '@/lib/api/security';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const returnTo = safeReturnTo(typeof params.returnTo === 'string' ? params.returnTo : undefined);
  const reasonRaw = typeof params.reason === 'string' ? params.reason : '';
  const reason = reasonRaw === 'auth' || reasonRaw === 'reauth' || reasonRaw === 'session' ? reasonRaw : 'auth';
  const qs = new URLSearchParams();
  if (returnTo !== '/home') qs.set('returnTo', returnTo);
  qs.set('reason', reason);
  permanentRedirect(`/login?${qs}`);
}
