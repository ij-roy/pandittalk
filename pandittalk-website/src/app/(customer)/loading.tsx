import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';

export default function Loading() {
  return (
    <main id="main-content" className="page stack" aria-busy="true" aria-live="polite">
      <p className="notice" role="status">Loading your account…</p>
      <p className="sr-only" id="customer-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
      <LinkKeyboardGroup className="actions" aria-label="While your account loads" aria-describedby="customer-loading-hint">
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
      </LinkKeyboardGroup>
      <div className="panel stack" aria-hidden="true">
        <span className="skeleton-line" />
        <span className="skeleton-line short" />
        <span className="skeleton-line shorter" />
        <span className="skeleton-button" />
      </div>
      <div className="panel stack" aria-hidden="true">
        <span className="skeleton-line short" />
        <span className="skeleton-line" />
        <span className="skeleton-line shorter" />
      </div>
    </main>
  );
}
