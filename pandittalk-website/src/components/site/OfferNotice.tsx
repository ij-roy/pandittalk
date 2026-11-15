import Link from 'next/link';
import { LinkKeyboardGroup } from './LinkKeyboardGroup';
import { NotifyOpenForm } from './NotifyOpenForm';
import { SiteIcon } from './SiteIcon';
import { availabilityCopy } from '@/content/availability';

export function OfferNotice({
  compact = false,
  hideSelfPricingLink = false,
  source,
}: {
  compact?: boolean;
  hideSelfPricingLink?: boolean;
  /** Placement id for the notify list — required so waitlist attribution stays consistent. */
  source: string;
}) {
  const placement = source.trim();
  const hintId = `offer-notice-hint-${placement || 'missing'}`;
  return (
    <aside className={`notice offer-notice${compact ? ' offer-notice-compact' : ''}`} role="status" aria-label="Booking availability" id={compact ? undefined : 'booking-availability'}>
      <SiteIcon name="info" size={19} />
      <div className="offer-notice-body">
        <p>
          <strong>{availabilityCopy.publicStatus}</strong> {availabilityCopy.publicDetail} {availabilityCopy.existingBooking}
          {' '}
          <span className="sr-only" id={hintId}>Arrow keys move between pricing when shown, how booking works, free tools and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</span>
          <LinkKeyboardGroup as="span" aria-label="Offer notice next steps" aria-describedby={hintId}>
            {!hideSelfPricingLink && <>{' '}<Link href="/pricing">View service details</Link></>}
            {' · '}<Link href="/how-it-works#booking-availability-how">How booking will work</Link>
            {' · '}<Link href="/tools">Try free tools</Link>
            {' · '}<Link href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </p>
        <p className="expert-meta" style={{ margin: '8px 0 0' }}>
          Email updates are optional — leaving an address does not create a booking or charge.
        </p>
        {placement
          ? <NotifyOpenForm source={placement} />
          : <p className="error" role="alert" aria-label="Offer notice configuration error">Notify signup is misconfigured on this page (missing source).</p>}
      </div>
    </aside>
  );
}
