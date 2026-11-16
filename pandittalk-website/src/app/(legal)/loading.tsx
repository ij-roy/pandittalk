import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { PageLoadingSkeleton } from '@/components/site/Skeleton';

export default function Loading() {
  return (
    <main id="main-content" className="legal-main" aria-busy="true" aria-live="polite">
      <p className="notice" role="status">Loading this policy…</p>
      <p className="sr-only" id="legal-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
      <LinkKeyboardGroup className="actions" aria-label="While this policy loads" aria-describedby="legal-loading-hint">
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
      </LinkKeyboardGroup>
      <PageLoadingSkeleton variant="legal" />
    </main>
  );
}
