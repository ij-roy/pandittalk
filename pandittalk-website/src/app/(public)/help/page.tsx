import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { grievanceEmail, privacyEmail, supportEmail } from '@/content/siteIdentity';
import { helpTopicIndex } from '@/content/help';
import { InformationPage } from '../about/InformationPage';
import { HelpSearch } from './HelpSearch';

export const metadata = {
  title: 'Help centre',
  description: 'Account access, payments, bookings, session timing and tools.',
  alternates: { canonical: '/help' },
  openGraph: {
    title: 'Help centre · Pandit Talk',
    description: 'Account access, payments, bookings, session timing and tools.',
    url: '/help',
  },
};

export default function Page() {
  return (
    <InformationPage eyebrow="We stay with the practical part" title="How can we help?" intro="Find a clear next step for bookings, session timing, payments, account access or tools. If you are ready to talk, start from a Pandit profile.">
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
