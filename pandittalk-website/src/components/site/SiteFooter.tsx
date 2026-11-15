import Link from 'next/link';
import { organizationName, supportEmail } from '@/content/siteIdentity';
import { BackToTop } from './BackToTop';
import { FooterNav } from './FooterNav';
import { LinkKeyboardGroup } from './LinkKeyboardGroup';
import { SiteIcon } from './SiteIcon';
import { availabilityCopy } from '@/content/availability';

const groups = {
  'Discover': [['/pandits', 'Explore Pandits'], ['/guidance', 'Find guidance'], ['/tools', 'Astrology tools'], ['/articles', 'Journal'], ['/how-it-works', 'How it works']],
  'Pandit Talk': [['/our-approach', 'Our approach'], ['/about', 'About'], ['/pricing', 'Pricing'], ['/trust', 'Trust & care'], ['/download', 'Mobile app']],
  'Here to help': [['/help', 'Help centre'], ['/contact', 'Contact'], ['/accessibility', 'Accessibility'], ['/grievance-redressal', 'Raise a grievance'], ['/for-pandits?apply=1', 'Apply as a Pandit']],
  'Legal': [['/privacy', 'Privacy'], ['/terms-and-conditions', 'Terms'], ['/refund-and-cancellation-policy', 'Refunds'], ['/cookie-policy', 'Cookies'], ['/pricing-policy', 'Pricing policy'], ['/disclaimer', 'Disclaimer'], ['/editorial-policy', 'Editorial'], ['/delete-account', 'Delete account']],
} as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  return <footer className="site-footer" role="contentinfo">
    <div className="footer-inner">
      <div className="footer-top">
        <div>
          <span className="eyebrow">Pandit Talk</span>
          <h2>You Talk. We Stay.</h2>
          <p>A conversation. A little clarity. Your next step.</p>
          <p className="expert-meta">{availabilityCopy.publicStatus} Explore Pandits, tools and drafts meanwhile.</p>
        </div>
        <p className="sr-only" id="footer-cta-hint">Arrow keys move between footer quick actions. Escape blurs. Skip to content still targets site-content.</p>
        <LinkKeyboardGroup className="footer-top-actions" aria-label="Footer quick actions" aria-describedby="footer-cta-hint">
          <Link className="button" href="/pandits">Explore Pandits<SiteIcon name="right" size={18} /></Link>
          <Link className="button secondary" href="/how-it-works#booking-availability-how">{availabilityCopy.headerLink}<SiteIcon name="right" size={18} /></Link>
          <Link className="button secondary" href="/guidance/start">Prepare a draft<SiteIcon name="right" size={18} /></Link>
        </LinkKeyboardGroup>
      </div>
      <p className="sr-only" id="footer-nav-hint">In each footer link group, Arrow keys move between links. Home and End jump to the first or last link. Back to top returns focus to site-content.</p>
      <div className="footer-links" aria-describedby="footer-nav-hint">
        {Object.entries(groups).map(([name, links]) => <FooterNav key={name} label={name} links={links} />)}
      </div>
      <div className="footer-bottom">
        <p>© {year} Pandit Talk · Operated by {organizationName}.</p>
        <p className="sr-only" id="footer-bottom-hint">Arrow keys move between footer support links including free tools and draft. Escape blurs the focused link. Back to top returns focus to site-content.</p>
        <p className="sr-only" id="footer-policy-hint">Arrow keys move between editorial and accessibility. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup as="p" aria-label="Footer support links" aria-describedby="footer-bottom-hint">
          <a href={`mailto:${supportEmail}?subject=${encodeURIComponent('Pandit Talk support')}`}>{supportEmail}<span className="sr-only"> (opens your email app)</span></a>
          {' · '}
          <Link href="/how-it-works#booking-availability-how">Get booking updates</Link>
          {' · '}
          <Link href="/tools">Free tools</Link>
          {' · '}
          <Link href="/guidance/start">Prepare a draft</Link>
          {' · '}
          <Link href="/trust">Trust &amp; care</Link>
        </LinkKeyboardGroup>
        <LinkKeyboardGroup as="p" aria-label="Footer policy reminders" aria-describedby="footer-policy-hint">
          Spiritual guidance does not guarantee outcomes or replace medical, legal or financial advice.{' '}
          <Link href="/editorial-policy">Editorial policy</Link>
          {' · '}
          <Link href="/accessibility">Accessibility</Link>
        </LinkKeyboardGroup>
        <p><BackToTop /></p>
      </div>
    </div>
  </footer>;
}
