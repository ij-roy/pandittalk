'use client';

import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';

export type HomeFaqItem = {
  q: string;
  a: string;
  linkHref: string;
  linkLabel: string;
};

/** Independent disclosures so people can compare answers without re-opening. */
export function HomeFaq({ items }: { items: readonly HomeFaqItem[] }) {
  return (
    <>
      <p className="expert-meta" id="home-faq-hint">You can open more than one answer. Arrow keys move between questions; Escape closes the focused item, returns from an answer link to its question, or moves to the next when already closed; Home and End jump to the first or last question. Skip to content still targets site-content.</p>
      <div
        className="home-faq"
        role="group"
        aria-describedby="home-faq-hint"
        onKeyDown={event => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          const open = target.closest('details.home-faq-item');
          if (!(open instanceof HTMLDetailsElement)) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            if (open.open) {
              open.open = false;
              open.querySelector('summary')?.focus();
            } else {
              const faqs = Array.from(event.currentTarget.querySelectorAll<HTMLDetailsElement>('details.home-faq-item'));
              const index = faqs.indexOf(open);
              const next = faqs[index + 1] || faqs[0];
              next?.querySelector('summary')?.focus();
            }
            return;
          }
          if (target.tagName !== 'SUMMARY') return;
          const faqs = Array.from(event.currentTarget.querySelectorAll<HTMLDetailsElement>('details.home-faq-item'));
          const index = faqs.indexOf(open);
          if (index < 0) return;
          let next = index;
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % faqs.length;
          else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + faqs.length) % faqs.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = faqs.length - 1;
          else return;
          event.preventDefault();
          faqs[next]?.querySelector('summary')?.focus();
        }}
      >
        {items.map((item, index) => {
          const answerId = `home-faq-answer-${index}`;
          return (
            <details className="home-faq-item" key={item.q}>
              <summary aria-controls={answerId}>{item.q}<span className="sr-only"> (expand or collapse)</span></summary>
              <div id={answerId} className="home-faq-answer" onKeyDown={event => {
                if (event.key !== 'Escape') return;
                const details = event.currentTarget.closest('details.home-faq-item');
                if (!(details instanceof HTMLDetailsElement)) return;
                event.preventDefault();
                details.open = false;
                details.querySelector('summary')?.focus();
              }}>
                <p>{item.a} <Link href={item.linkHref}>{item.linkLabel}</Link></p>
              </div>
            </details>
          );
        })}
      </div>
      <p className="expert-meta">Still looking? <span className="sr-only" id="home-faq-help-hint">Arrow keys move between help centre, free tools, draft, booking updates and contact. Escape blurs. Skip remains site-content.</span><LinkKeyboardGroup as="span" aria-label="Home FAQ help links" aria-describedby="home-faq-help-hint"><Link href="/help">Browse the help centre</Link>, <Link href="/tools">try free tools</Link>, <Link href="/guidance/start">prepare a draft</Link>, <Link href="/how-it-works#booking-availability-how">get booking updates</Link>, or <Link href="/contact">contact support</Link></LinkKeyboardGroup>.</p>
    </>
  );
}
