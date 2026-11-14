import { permanentRedirect } from 'next/navigation';
import { safeReturnTo } from '@/lib/api/security';

function loginRedirect(searchParams: Record<string, string | string[] | undefined>) {
  const returnTo = safeReturnTo(typeof searchParams.returnTo === 'string' ? searchParams.returnTo : undefined);
  const reasonRaw = typeof searchParams.reason === 'string' ? searchParams.reason : '';
  const reason = reasonRaw === 'auth' || reasonRaw === 'reauth' || reasonRaw === 'session' ? reasonRaw : '';
  const qs = new URLSearchParams();
  if (returnTo !== '/home') qs.set('returnTo', returnTo);
  if (reason) qs.set('reason', reason);
  const query = qs.toString();
  permanentRedirect(query ? `/login?${query}` : '/login');
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  loginRedirect(await searchParams);
}
