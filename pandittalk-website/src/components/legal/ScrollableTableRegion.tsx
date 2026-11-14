'use client';

import type { ReactNode } from 'react';

/** Focusable wide-table region: Escape blurs so keyboard users can leave the scroll box. */
export function ScrollableTableRegion({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className="legal-table-wrap"
      role="region"
      aria-label={`${label}. On small screens, swipe sideways to read every column. Press Escape to leave the table.`}
      tabIndex={0}
      onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }}
    >
      {children}
    </div>
  );
}
