import Link from 'next/link';
import Image from 'next/image';
import { organizationName, supportEmail } from '@/content/siteIdentity';
import { BackToTop } from './BackToTop';
import { FooterNav } from './FooterNav';
import { LinkKeyboardGroup } from './LinkKeyboardGroup';
import { SiteIcon } from './SiteIcon';

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
      <div className="footer-brand-row">
        <div className="footer-brand-block">
          <Link className="footer-brand-link" href="/" aria-label="Pandit Talk home">
            <Image src="/logo.png" alt="" width={36} height={36} sizes="36px" />
            <span aria-hidden="true">Pandit Talk</span>
          </Link>
          <p>Guidance, tools, and Pandit profiles in one calm place.</p>
        </div>
        <p className="sr-only" id="footer-cta-hint">Arrow keys move between footer actions. Escape blurs. Skip to content still targets site-content.</p>
        <LinkKeyboardGroup className="footer-actions" aria-label="Footer primary action" aria-describedby="footer-cta-hint">
          <Link className="button" href="/pandits">Explore Pandits<SiteIcon name="right" size={18} /></Link>
        </LinkKeyboardGroup>
      </div>
      <p className="sr-only" id="footer-nav-hint">In each footer link group, Arrow keys move between links. Home and End jump to the first or last link. Back to top returns focus to site-content.</p>
      <div className="footer-links" aria-describedby="footer-nav-hint">
        {Object.entries(groups).map(([name, links]) => <FooterNav key={name} label={name} links={links} />)}
      </div>
      <div className="footer-bottom">
        <p className="sr-only" id="footer-bottom-hint">Arrow keys move between footer support links including free tools. Escape blurs the focused link. Back to top returns focus to site-content.</p>
        <p className="sr-only" id="footer-policy-hint">Arrow keys move between editorial and accessibility. Escape blurs. Skip remains site-content.</p>
        <div className="footer-utility-row">
          <p className="footer-copyright"><span>© {year} Pandit Talk</span><span>Operated by {organizationName}.</span></p>
          <LinkKeyboardGroup as="nav" className="footer-meta-links" aria-label="Footer support links" aria-describedby="footer-bottom-hint">
            <a href={`mailto:${supportEmail}?subject=${encodeURIComponent('Pandit Talk support')}`}>{supportEmail}<span className="sr-only"> (opens your email app)</span></a>
            <Link href="/how-it-works#booking-availability-how">Get booking updates</Link>
            <Link href="/tools">Free tools</Link>
          </LinkKeyboardGroup>
          <p className="footer-back-top"><BackToTop /></p>
        </div>
        <div className="footer-policy-row">
          <p className="footer-disclaimer">Spiritual guidance does not guarantee outcomes or replace medical, legal or financial advice.</p>
          <LinkKeyboardGroup as="nav" className="footer-policy-links" aria-label="Footer policy reminders" aria-describedby="footer-policy-hint">
            <Link href="/editorial-policy">Editorial policy</Link>
            <Link href="/accessibility">Accessibility</Link>
          </LinkKeyboardGroup>
        </div>
      </div>
    </div>
  </footer>;
}
