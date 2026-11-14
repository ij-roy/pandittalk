import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';

export default function Loading() {
  return (
    <main id="main-content" className="page journal-page" aria-busy="true" aria-live="polite">
      <p className="notice" role="status">Loading the journal…</p>
      <p className="sr-only" id="journal-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
      <LinkKeyboardGroup className="actions" aria-label="While the journal loads" aria-describedby="journal-loading-hint">
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
      </LinkKeyboardGroup>
      <div className="journal-grid" aria-hidden="true">
        <div className="panel stack">
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
          <span className="skeleton-line shorter" />
        </div>
        <div className="panel stack">
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
          <span className="skeleton-line shorter" />
        </div>
        <div className="panel stack">
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
          <span className="skeleton-line shorter" />
        </div>
      </div>
    </main>
  );
}
