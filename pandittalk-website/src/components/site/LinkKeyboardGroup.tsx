'use client';

import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';

/** Arrow / Home / End between links and enabled buttons in a group; Escape blurs the focused control. */
export function LinkKeyboardGroup({
  children,
  className,
  role,
  style,
  inert,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  role?: string;
  style?: CSSProperties;
  /** When true, background recovery links stay out of the tab order (e.g. session confirm dialogs). */
  inert?: boolean | undefined;
  'aria-label'?: string;
  'aria-describedby'?: string;
  as?: 'div' | 'nav' | 'section' | 'p' | 'span';
}) {
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!(event.target instanceof HTMLElement)) return;
    if (!(event.target instanceof HTMLAnchorElement) && !(event.target instanceof HTMLButtonElement)) return;
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)'),
    );
    const index = items.indexOf(event.target);
    if (index < 0) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.target.blur();
      return;
    }
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    items[next]?.focus();
  }

  return (
    <Tag
      className={className}
      role={role}
      style={style}
      inert={inert || undefined}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      onKeyDown={onKeyDown}
    >
      {children}
    </Tag>
  );
}
