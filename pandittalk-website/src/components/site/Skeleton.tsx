import type { ReactNode } from 'react';

type SkeletonVariant = 'line' | 'short' | 'shorter' | 'block' | 'avatar' | 'button';

type SkeletonProps = {
  variant?: SkeletonVariant;
  className?: string;
};

export function Skeleton({ variant = 'line', className = '' }: SkeletonProps) {
  const classes = [
    variant === 'block' || variant === 'avatar' ? 'skeleton-block' : 'skeleton-line',
    variant === 'short' || variant === 'shorter' ? variant : '',
    variant === 'avatar' ? 'skeleton-avatar' : '',
    variant === 'button' ? 'skeleton-button' : '',
    className,
  ].filter(Boolean).join(' ');
  return <span className={classes} data-skeleton={variant} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return <div className="skeleton-copy" data-skeleton="text" aria-hidden="true">
    {Array.from({ length: Math.max(1, lines) }, (_, index) => <Skeleton key={index} variant={index === lines - 1 ? 'short' : 'line'} />)}
  </div>;
}

export function SkeletonCard({ children }: { children?: ReactNode }) {
  return <div className="skeleton-card" data-skeleton="card" aria-hidden="true">
    {children || <SkeletonText lines={3} />}
  </div>;
}

export function SkeletonRows({ count = 3, type = 'row' }: { count?: number; type?: string }) {
  return <div className="skeleton-rows" data-skeleton={`${type}-rows`} aria-hidden="true">
    {Array.from({ length: Math.max(1, count) }, (_, index) => <div className="skeleton-row" data-skeleton={`${type}-row`} key={index}>
      <Skeleton variant="avatar" />
      <SkeletonText lines={3} />
      <Skeleton variant="button" />
    </div>)}
  </div>;
}

export function PageLoadingSkeleton({ variant = 'page' }: { variant?: 'page' | 'auth' | 'public' | 'customer' | 'journal' | 'legal' }) {
  if (variant === 'auth') {
    return <div className="page-skeleton page-skeleton-auth" data-skeleton="page" aria-hidden="true">
      <Skeleton variant="short" />
      <Skeleton variant="block" className="skeleton-heading" />
      <SkeletonText lines={2} />
      <div className="skeleton-form"><Skeleton variant="line" /><Skeleton variant="block" className="skeleton-input" /><Skeleton variant="button" className="skeleton-button-wide" /></div>
    </div>;
  }
  if (variant === 'journal') {
    return <div className="page-skeleton page-skeleton-journal" data-skeleton="page" aria-hidden="true">{Array.from({ length: 3 }, (_, index) => <SkeletonCard key={index} />)}</div>;
  }
  if (variant === 'legal') {
    return <div className="page-skeleton page-skeleton-legal" data-skeleton="page" aria-hidden="true"><Skeleton variant="short" /><Skeleton variant="block" className="skeleton-heading" /><SkeletonText lines={8} /></div>;
  }
  return <div className={`page-skeleton page-skeleton-${variant}`} data-skeleton="page" aria-hidden="true">
    <div className="skeleton-hero"><Skeleton variant="short" /><Skeleton variant="block" className="skeleton-heading" /><SkeletonText lines={3} /><Skeleton variant="button" /></div>
    <div className="skeleton-card-grid"><SkeletonCard /><SkeletonCard /></div>
  </div>;
}

export function LoadingState({ label, variant = 'rows' }: { label: string; variant?: 'rows' | 'cards' | 'detail' | 'form' }) {
  return <section className={`data-loading-state data-loading-${variant}`} role="status" aria-busy="true">
    <p className="expert-meta">{label}</p>
    <div aria-hidden="true">
      {variant === 'rows' && <SkeletonRows count={3} type="loading" />}
      {variant === 'cards' && <div className="skeleton-card-grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}
      {variant === 'detail' && <div className="skeleton-detail"><Skeleton variant="short" /><Skeleton variant="block" className="skeleton-heading" /><SkeletonText lines={5} /><Skeleton variant="button" /></div>}
      {variant === 'form' && <div className="skeleton-form"><Skeleton variant="line" /><Skeleton variant="block" className="skeleton-input" /><Skeleton variant="line" /><Skeleton variant="block" className="skeleton-input" /><Skeleton variant="button" className="skeleton-button-wide" /></div>}
    </div>
  </section>;
}
