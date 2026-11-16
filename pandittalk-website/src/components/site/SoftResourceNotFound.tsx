import Link from 'next/link';
import { FocusMainHeading } from '@/components/site/FocusMainHeading';
import { GoBackButton } from '@/components/site/GoBackButton';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';

type RecoveryLink = {
  href: string;
  label: string;
  /** Defaults to secondary button styling. */
  primary?: boolean;
};

/**
 * Contextual soft-404 for a missing resource (article, help topic, author, …).
 * Prefer this over the global not-found page so seekers keep recovery in context.
 */
export function SoftResourceNotFound({
  eyebrow = 'Not found',
  title,
  description,
  primaryHref,
  primaryLabel,
  links = [],
  notifySource,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  links?: RecoveryLink[];
  /** Placement id for waitlist attribution — required. */
  notifySource: string;
}) {
  const placement = notifySource.trim();
  return (
    <main id="main-content" className="page stack" style={{ maxWidth: 720 }}>
      <FocusMainHeading id="soft-missing-title" />
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="soft-missing-title" tabIndex={-1}>
        {title}
      </h1>
      <p className="lede">{description}</p>
      <p className="sr-only" id="soft-missing-recovery-hint">Arrow keys move between recovery actions including Go back, free tools and draft when listed. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
      <LinkKeyboardGroup className="actions" aria-label="Missing resource recovery" aria-describedby="soft-missing-recovery-hint">
        <Link className="button" href={primaryHref}>{primaryLabel}</Link>
        <GoBackButton fallbackHref={primaryHref} />
        {links.map(link => (
          <Link
            key={`${link.href}:${link.label}`}
            className={link.primary ? 'button' : 'button secondary'}
            href={link.href}
          >
            {link.label}
          </Link>
        ))}
      </LinkKeyboardGroup>
      <aside className="notice" role="status" aria-label="Booking availability">
        <p>
          A missing page does not create or cancel a booking.
          {' '}
          <span className="sr-only" id="soft-missing-notify-hint">Arrow keys move between free tools, optional notes and how booking works. Escape blurs. Skip remains site-content.</span>
          <LinkKeyboardGroup as="span" aria-label="While this page is missing" aria-describedby="soft-missing-notify-hint">
            <Link href="/tools">Try free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare an optional note</Link>
            {' · '}
            <Link href="/how-it-works#booking-availability-how">How booking will work</Link>
          </LinkKeyboardGroup>
          .
        </p>
        <div className="notify-inline" style={{ marginTop: 12 }}>
          {placement
            ? <NotifyOpenForm source={placement} />
            : <p className="error" role="alert">Notify signup is misconfigured on this page (missing source).</p>}
        </div>
      </aside>
    </main>
  );
}
