import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { PageLoadingSkeleton } from '@/components/site/Skeleton';

export default function Loading() {
  return (
    <main id="main-content" className="page stack auth-page" aria-busy="true" aria-live="polite">
      <p className="notice" role="status">Preparing secure sign-in…</p>
      <p className="sr-only" id="auth-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and support while sign-in loads.</p>
      <LinkKeyboardGroup className="actions" aria-label="While sign-in loads" aria-describedby="auth-loading-hint">
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/help">Get account help →</Link>
      </LinkKeyboardGroup>
      <PageLoadingSkeleton variant="auth" />
    </main>
  );
}
