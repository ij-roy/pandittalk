import Link from 'next/link';
import { EscapeBlurNotice } from '@/components/site/EscapeBlurNotice';
import { FocusMainHeading } from '@/components/site/FocusMainHeading';
import { FocusOnHash } from '@/components/site/FocusOnHash';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { SiteIcon } from '@/components/site/SiteIcon';

export default function PaidTool({
  title,
  kind = 'report',
}: {
  title: string;
  kind?: 'report' | 'monthly-horoscope';
}) {
  const isMonthly = kind === 'monthly-horoscope';
  return (
    <main id="main-content" className="page stack tool-flow">
      <FocusMainHeading id="paid-tool-title" />
      <p className="eyebrow">Purchases paused</p>
      <h1 id="paid-tool-title" tabIndex={-1}>{title}</h1>
      <p className="lede">
        {isMonthly
          ? 'New monthly horoscope purchases are paused while we verify pricing, purchase recovery and saved-report protection. Existing monthly reports you already bought remain available after you sign in.'
          : 'Detailed report purchases are paused while we verify pricing, purchase recovery and saved-report protection. Nothing on this page can charge your wallet or card.'}
      </p>

      <aside className="notice" role="status" aria-label="No charge on this page">
        <strong>You will not be charged here.</strong>{' '}
        {isMonthly
          ? 'There is no purchase form on this page. Sign in only if you already own a monthly report.'
          : 'Existing purchased reports remain available when you sign in.'}
        {' '}Want a human conversation?{' '}
        <span className="sr-only" id="paid-tool-booking-hint">Arrow keys move between Pandits, free tools and optional notes. Escape blurs. Skip remains site-content.</span>
        <LinkKeyboardGroup as="span" aria-label="Paid tool booking links" aria-describedby="paid-tool-booking-hint">
          <Link href="/pandits">Explore Pandits</Link>
          {' · '}
          <Link href="/tools">Try free tools</Link>
          {' · '}
          <Link href="/guidance/start">Prepare a draft</Link>
        </LinkKeyboardGroup>
        . This page never charges you.
      </aside>

      <div className="panel stack">
        <h2>What you can do meanwhile</h2>
        <p className="sr-only" id="paid-tool-list-hint">Arrow keys move between paid-report alternatives. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup as="nav" aria-label="Paused purchase alternatives list" aria-describedby="paid-tool-list-hint">
          <ul className="link-list">
            <li><Link href="/tools/horoscope">Try the free daily horoscope</Link></li>
            <li><Link href="/tools">Browse free reflection tools</Link></li>
            <li><Link href="/login?returnTo=%2Freports&reason=auth">Sign in to open saved reports</Link></li>
            <li><Link href="/pricing">Read current pricing and booking terms</Link></li>
            <li><Link href="/pricing-policy">Formal pricing policy</Link></li>
            <li><Link href="/pandits">Explore Pandits for a later conversation</Link></li>
            <li><Link href="/guidance/start">Prepare a private draft</Link></li>
            <li><Link href="/help/tools-and-readings">Tools and readings help</Link></li>
            <li><Link href="/help/coins-and-payment-pending">Payment and coin help</Link></li>
          </ul>
        </LinkKeyboardGroup>
        <p className="sr-only" id="paid-tool-actions-hint">Arrow keys move between Sign in, free tools and optional notes. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Paused purchase alternatives" aria-describedby="paid-tool-actions-hint">
          <Link href="/login?returnTo=%2Freports&reason=auth" className="button">Sign in to view reports</Link>
          <Link href={isMonthly ? '/tools/horoscope' : '/tools'} className="button secondary">
            {isMonthly ? 'Open free daily horoscope' : 'Browse free tools'}
          </Link>
          <Link href="/guidance/start" className="text-link">Prepare a private draft →</Link>
          <Link href="/pandits" className="text-link">Explore Pandits →</Link>
        </LinkKeyboardGroup>
      </div>

      <FocusOnHash hash="#report-purchase-updates" targetId="report-purchase-updates" />
      <EscapeBlurNotice className="notice offer-notice" role="status" aria-label="Purchase availability" id="report-purchase-updates">
        <SiteIcon name="info" size={19} />
        <div className="offer-notice-body">
          <p><strong>{isMonthly ? 'Want a note when monthly horoscopes open again?' : 'Want a note when detailed reports open?'}</strong></p>
          <NotifyOpenForm source={isMonthly ? 'website_paid_tool_monthly' : 'website_paid_tool'} />
          <p className="sr-only" id="paid-tool-notify-followup-hint">Arrow keys move between free tools and optional notes. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup as="p" aria-label="While paid reports stay paused" aria-describedby="paid-tool-notify-followup-hint">
            Meanwhile: <Link href="/tools">Try free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
            {' · '}
            <Link href="/pandits">Explore Pandits</Link>
          </LinkKeyboardGroup>
        </div>
      </EscapeBlurNotice>

      <aside className="notice" role="status">
        Prefer a human conversation?{' '}
        <span className="sr-only" id="paid-tool-conversation-hint">Arrow keys move between Pandits, optional notes and free tools. Escape blurs. Skip remains site-content.</span>
        <LinkKeyboardGroup as="span" aria-label="Paid tool conversation alternatives" aria-describedby="paid-tool-conversation-hint">
          <Link href="/pandits">Explore Pandits</Link>
          {' · '}
          <Link href="/guidance/start">Prepare a private draft</Link>
          {' · '}
          <Link href="/tools">Browse free tools</Link>
        </LinkKeyboardGroup>
        . Exploring does not create a booking or charge.
      </aside>
    </main>
  );
}
