"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import "./legal.css";

const documents = [
  ["/privacy", "Privacy"],
  ["/terms-and-conditions", "Terms"],
  ["/refund-and-cancellation-policy", "Refunds & cancellations"],
  ["/pricing-policy", "Pricing"],
  ["/cookie-policy", "Cookies"],
  ["/disclaimer", "Disclaimer"],
  ["/grievance-redressal", "Grievances"],
  ["/delete-account", "Delete account"],
] as const;

export default function LegalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = tabsRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    active.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [pathname]);

  return (
    <div className="legal-root">
      <nav className="legal-nav" aria-label="Policies and your rights" aria-describedby="legal-tabs-hint">
        <span className="legal-nav__label">Policies & your rights</span>
        <p className="sr-only" id="legal-tabs-hint">Use the policy links to move between documents. The selected policy is marked current.</p>
        <div
          className="legal-tabs"
          ref={tabsRef}
          onKeyDown={event => {
            if (!(event.target instanceof HTMLElement)) return;
            const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[href]'));
            const index = links.indexOf(event.target as HTMLAnchorElement);
            if (index < 0) return;
            if (event.key === 'Escape') {
              event.preventDefault();
              const current = links.find(link => link.getAttribute('aria-current') === 'page');
              if (current && document.activeElement !== current) {
                current.focus();
                const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                current.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
                return;
              }
              event.target.blur();
              return;
            }
            let next = index;
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % links.length;
            else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + links.length) % links.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = links.length - 1;
            else return;
            event.preventDefault();
            links[next]?.focus();
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            links[next]?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
          }}
        >
          {documents.map(([href, label]) => (
            <Link key={href} href={href} className="legal-tab" aria-current={pathname === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}
