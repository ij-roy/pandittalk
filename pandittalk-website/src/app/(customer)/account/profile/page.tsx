import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { PageLoadingSkeleton } from '@/components/site/Skeleton';
import View from '@/features/account/ProfileForm';

export const metadata: Metadata = { title: 'Your profile', description: 'Update personal and birth details on Pandit Talk.' };
export default function Page() {
  return (
    <Suspense fallback={
      <main id="main-content" className="page stack" aria-busy="true" aria-live="polite">
        <p className="notice" role="status">Loading your profile…</p>
        <p className="sr-only" id="profile-page-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
        <LinkKeyboardGroup className="actions" aria-label="While your profile loads" aria-describedby="profile-page-loading-hint">
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
        <PageLoadingSkeleton variant="auth" />
      </main>
    }>
      <View />
    </Suspense>
  );
}
