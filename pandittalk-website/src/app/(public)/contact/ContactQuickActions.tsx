'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { privacyEmail, supportEmail } from '@/content/siteIdentity';

const subjects = [
  { label: 'Account or sign-in', subject: 'Account access help' },
  { label: 'Existing booking', subject: 'Existing booking or past consultation' },
  { label: 'Payment or wallet', subject: 'Payment or wallet question' },
  { label: 'Privacy or data rights', subject: 'Privacy request', email: 'privacy' as const },
  { label: 'Something else', subject: 'Pandit Talk support' },
] as const;

export function ContactQuickActions() {
  const pathname = usePathname() || '/contact';
  const [previousPath, setPreviousPath] = useState('');

  useEffect(() => {
    try {
      const ref = document.referrer;
      if (!ref) return;
      const url = new URL(ref);
      if (url.origin === location.origin && url.pathname && url.pathname !== pathname) {
        setPreviousPath(url.pathname + url.search);
      }
    } catch {
      /* ignore bad referrer */
    }
  }, [pathname]);

  return (
    <div className="contact-quick stack">
      <p className="info-label">Looking for booking availability?</p>
      <p className="expert-meta">
        Choose a Pandit to see scheduled availability or Chat Now before you contact support about a new conversation.
      </p>
      <p className="sr-only" id="contact-booking-alt-hint">Arrow keys move between Pandits, optional notes and free tools instead of support email. Escape blurs. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Booking availability instead of support email" aria-describedby="contact-booking-alt-hint">
        <Link className="button" href="/pandits">Explore Pandits</Link>
        <Link className="button secondary" href="/guidance/start">Prepare an optional note</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
      </LinkKeyboardGroup>
      <p className="info-label">Start an email with a clear subject</p>
      <p className="sr-only" id="contact-email-subjects-hint">Arrow keys move between email subject shortcuts. Escape blurs the focused control. Skip remains site-content.</p>
      <LinkKeyboardGroup
        className="actions contact-quick__actions"
        role="group"
        aria-label="Email subject shortcuts"
        aria-describedby="contact-email-subjects-hint"
      >
        {subjects.map(item => {
          const to = 'email' in item && item.email === 'privacy' ? privacyEmail : supportEmail;
          const pages = previousPath
            ? `Page you were on: ${pathname}\nPrevious page: ${previousPath}\n`
            : `Page you were on: ${pathname}\n`;
          const body = `Booking or payment reference (if any):\n\nWhat happened:\n\nThis email is for an existing booking, payment, or account issue.\n\n${pages}`;
          return (
            <a
              key={item.subject}
              className="button secondary"
              href={`mailto:${to}?subject=${encodeURIComponent(item.subject)}&body=${encodeURIComponent(body)}`}
            >
              {item.label}
              <span className="sr-only"> — opens your email app with subject “{item.subject}”</span>
            </a>
          );
        })}
      </LinkKeyboardGroup>
      <p className="expert-meta">Use <strong>Existing booking</strong> for a past consultation, payment, or account issue. Leave birth charts, palm images and private conversation text out of your first email. The page path{previousPath ? ' and previous page are' : ' is'} filled in for you — edit if needed.</p>
      <p className="sr-only" id="contact-recovery-hint">Arrow keys move between account help, payment help, optional notes, free tools and grievance. Escape blurs. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions contact-recovery-links" style={{ marginTop: 4 }} aria-label="Contact recovery links" aria-describedby="contact-recovery-hint">
        <Link className="text-link" href="/help/account-access">Account access help →</Link>
        <Link className="text-link" href="/help/coins-and-payment-pending">Payment help →</Link>
        <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        <Link className="text-link" href="/tools">Free tools →</Link>
        <Link className="text-link" href="/pandits">Explore Pandits →</Link>
        <Link className="text-link" href="/grievance-redressal">Raise a grievance →</Link>
      </LinkKeyboardGroup>
    </div>
  );
}
