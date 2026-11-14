'use client';

import type { AriaRole, KeyboardEvent, ReactNode } from 'react';

/** Focusable status/alert shell that blurs on Escape (safe to use from server pages). */
export function EscapeBlurNotice({
  children,
  className = 'notice',
  role = 'status',
  id,
  'aria-label': ariaLabel,
  'aria-live': ariaLive,
}: {
  children: ReactNode;
  className?: string;
  role?: AriaRole;
  id?: string;
  'aria-label'?: string;
  'aria-live'?: 'polite' | 'assertive' | 'off';
}) {
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).blur();
  }

  return (
    <aside
      id={id}
      className={className}
      role={role}
      aria-label={ariaLabel}
      aria-live={ariaLive}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      {children}
    </aside>
  );
}
