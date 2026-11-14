import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { grievanceEmail, privacyEmail, supportEmail } from '@/content/siteIdentity';
import { helpTopicIndex } from '@/content/help';
import { InformationPage } from '../about/InformationPage';
import { HelpSearch } from './HelpSearch';

export const metadata = {
  title: 'Help centre',
  description: 'Account access, payments, existing bookings and tools. New No Timer bookings are not open yet on the website.',
  alternates: { canonical: '/help' },
  openGraph: {
    title: 'Help centre · Pandit Talk',
    description: 'Account access, payments, existing bookings and tools. New No Timer bookings are not open yet.',
    url: '/help',
  },
};

export default function Page() {
  return (
    <InformationPage eyebrow="We stay with the practical part" title="How can we help?" intro="Find a clear next step for an existing booking, payment, account access or tool. New No Timer bookings are not open yet — this centre will not schedule a new consultation.">
      <aside className="notice offer-notice" role="status" aria-label="Booking availability">
        <p>
          <strong>Looking to book a new conversation?</strong> New No Timer bookings are not open yet on the website.
          These topics cover existing bookings, payments, account access and tools.{' '}
          <span className="sr-only" id="help-index-pause-hint">Arrow keys move between Pandits, draft, free tools and booking updates. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</span>
          <LinkKeyboardGroup as="span" aria-label="Help index pause alternatives" aria-describedby="help-index-pause-hint">
            <Link href="/pandits">Explore Pandits</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
            {' · '}
            <Link href="/tools">Try free tools</Link>
            {' · '}
            <Link href="/how-it-works#booking-availability-how">Booking updates</Link>
          </LinkKeyboardGroup>
        </p>
        <NotifyOpenForm source="website_help_index" />
      </aside>
      <HelpSearch topics={helpTopicIndex} />
      <section className="panel info-card">
        <h2>Need a hand?</h2>
        <p>Please do not include birth details, palm images or conversation text in an initial email.</p>
        <p className="sr-only" id="help-contact-hint">Arrow keys move between support inboxes, contact, free tools and draft. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup as="nav" aria-label="Help centre contact inboxes" aria-describedby="help-contact-hint">
          <ul className="link-list">
            <li>Account support: <a href={`mailto:${supportEmail}`}>{supportEmail}<span className="sr-only"> (opens your email app)</span></a></li>
            <li>Privacy questions: <a href={`mailto:${privacyEmail}`}>{privacyEmail}<span className="sr-only"> (opens your email app)</span></a></li>
            <li>Grievance Officer: <a href={`mailto:${grievanceEmail}`}>{grievanceEmail}<span className="sr-only"> (opens your email app)</span></a></li>
            <li><Link href="/contact">More contact options →</Link></li>
            <li><Link href="/tools">Try free tools →</Link></li>
            <li><Link href="/guidance/start">Prepare a draft →</Link></li>
          </ul>
        </LinkKeyboardGroup>
      </section>
    </InformationPage>
  );
}
