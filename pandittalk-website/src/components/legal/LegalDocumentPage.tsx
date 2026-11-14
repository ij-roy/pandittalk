"use client";

import type { LegalBlock, LegalDocument } from "@/content/legal/types";
import { grievanceEmail, supportEmail } from "@/content/siteIdentity";
import { FocusOnHash } from "@/components/site/FocusOnHash";
import { LinkKeyboardGroup } from "@/components/site/LinkKeyboardGroup";
import { NotifyOpenForm } from "@/components/site/NotifyOpenForm";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

function RichText({ text }: { text: string }) {
  const parts = text.split(
    /(https?:\/\/[^\s]+|[a-z0-9._+-]+@pandittalk\.com)/gi,
  );

  return (
    <>
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer">
              {part.replace(/^https?:\/\//, "")}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          );
        }
        if (part.includes("@pandittalk.com")) {
          return (
            <a key={i} href={`mailto:${part}`}>
              {part}
              <span className="sr-only"> (opens your email app)</span>
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "p":
            return (
              <p key={index}>
                <RichText text={block.text} />
              </p>
            );
          case "note":
            return (
              <p key={index} className="legal-note">
                <RichText text={block.text} />
              </p>
            );
          case "list":
            return (
              <ul key={index} className="legal-list">
                {block.items.map((item, i) => (
                  <li key={i}>
                    <RichText text={item} />
                  </li>
                ))}
              </ul>
            );
          case "table":
            return (
              <div key={index} className="legal-table-wrap" role="region" aria-label={`${block.headers.join(", ")}. On small screens, swipe sideways to read every column. Press Escape to leave the table.`} tabIndex={0} onKeyDown={event => {
                if (event.key !== "Escape") return;
                event.preventDefault();
                (event.currentTarget as HTMLElement).blur();
              }}>
                <table className="legal-table">
                  <caption className="sr-only">{block.headers.join(" · ")} data table</caption>
                  <thead>
                    <tr>
                      {block.headers.map((header) => (
                        <th key={header} scope="col">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci}>
                            <RichText text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "subsection":
            return (
              <div key={index}>
                <h3>{block.title}</h3>
                <Blocks blocks={block.blocks} />
              </div>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  const idsKey = ids.join("|");

  useEffect(() => {
    const list = idsKey ? idsKey.split("|") : [];
    if (!list.length) return;

    const getSpyLine = () => {
      const nav = document.querySelector(".site-header");
      if (nav instanceof HTMLElement) {
        return Math.max(120, nav.getBoundingClientRect().bottom + 12);
      }
      const rem =
        Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        ) || 16;
      return (4.25 + 1) * rem;
    };

    const update = () => {
      const spyLine = getSpyLine();
      let current = list[0];

      for (const id of list) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - spyLine <= 0) {
          current = id;
        } else {
          break;
        }
      }

      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 8;
      if (atBottom) {
        current = list[list.length - 1] ?? current;
      }

      setActive((prev) => (prev === current ? prev : current));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [idsKey]);

  return active;
}

export default function LegalDocumentPage({
  document,
}: {
  document: LegalDocument;
}) {
  const sectionIds = useMemo(
    () => document.sections.map((s) => s.id),
    [document.sections],
  );
  const active = useActiveSection(sectionIds);
  const tocRef = useRef<HTMLUListElement>(null);
  const other =
    document.slug === "privacy"
      ? { href: "/terms-and-conditions", label: "Terms and Conditions" }
      : { href: "/privacy", label: "Privacy Policy" };

  useEffect(() => {
    const current = tocRef.current?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!current) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    current.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [active]);

  return (
    <main id="main-content" className="legal-main">
      <FocusOnHash hash="#legal-document-start" targetId="legal-document-start" />
      <header className="legal-hero">
        <div className="legal-hero__inner">
          <p className="eyebrow">Policies & your rights</p>
          <h1>{document.title}</h1>
          <p className="legal-hero__summary">{document.summary}</p>
          <div className="legal-meta">
            <span className="legal-chip">
              Version <strong>{document.version}</strong>
            </span>
            <span className="legal-chip">
              Effective <strong>{document.effectiveDate}</strong>
            </span>
          </div>
          <p className="expert-meta">
            <span className="sr-only" id="legal-skip-doc-hint">Arrow keys move between Skip to document, free tools and draft. Escape blurs. Skip to content still targets site-content. NotifyOpenForm still requires source.</span>
            <LinkKeyboardGroup as="span" aria-label="Legal document shortcuts" aria-describedby="legal-skip-doc-hint">
              <a
                href="#legal-document-start"
                onClick={(event) => {
                  event.preventDefault();
                  const target = window.document.getElementById("legal-document-start");
                  if (!target) return;
                  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                  history.replaceState(null, "", "#legal-document-start");
                  target.focus({ preventScroll: true });
                }}
              >
                Skip to document
              </a>
              {" · "}
              <Link href="/tools">Free tools</Link>
              {" · "}
              <Link href="/guidance/start">Prepare a draft</Link>
            </LinkKeyboardGroup>
            {" · "}
            Use the on-this-page list to jump between sections.
          </p>
        </div>
      </header>

      <div className="legal-body">
        <nav className="legal-toc" aria-label="On this page">
          <p className="legal-toc__title">On this page</p>
          <p className="sr-only" id="legal-toc-hint">Arrow keys move between sections. Home and End jump to the first or last. Escape blurs the focused section link. Skip remains site-content.</p>
          <ul
            className="legal-toc__list"
            ref={tocRef}
            aria-describedby="legal-toc-hint"
            onKeyDown={(event) => {
              if (!(event.target instanceof HTMLElement)) return;
              const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[href]'));
              const index = links.indexOf(event.target as HTMLAnchorElement);
              if (index < 0) return;
              if (event.key === 'Escape') {
                event.preventDefault();
                event.target.blur();
                return;
              }
              let next = index;
              if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % links.length;
              else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + links.length) % links.length;
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = links.length - 1;
              else return;
              event.preventDefault();
              links[next]?.focus();
              links[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }}
          >
            {document.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="legal-toc__link"
                  data-active={active === section.id ? "true" : "false"}
                  aria-current={active === section.id ? "location" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    const heading = window.document.getElementById(`${section.id}-title`);
                    const sectionEl = window.document.getElementById(section.id);
                    const target = heading || sectionEl;
                    if (!target) return;
                    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                    history.replaceState(null, "", `#${section.id}`);
                    if (heading) heading.focus({ preventScroll: true });
                    else target.focus({ preventScroll: true });
                  }}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="legal-article" id="legal-document-start" tabIndex={-1}>
          {document.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="legal-section"
              aria-labelledby={`${section.id}-title`}
            >
              <h2 id={`${section.id}-title`} tabIndex={-1}>{section.title}</h2>
              <Blocks blocks={section.blocks} />
            </section>
          ))}
        </article>
      </div>

      <footer className="legal-footer">
        <div className="legal-footer__panel">
          <p className="legal-footer__text">
            Questions about this document? Reach us at{" "}
            <a href={`mailto:${supportEmail}`}>
              {supportEmail}
              <span className="sr-only"> (opens your email app)</span>
            </a>
            {document.slug === "privacy" && (
              <>
                {" "}
                · Privacy grievances:{" "}
                <a href={`mailto:${grievanceEmail}`}>
                  {grievanceEmail}
                  <span className="sr-only"> (opens your email app)</span>
                </a>
              </>
            )}
          </p>
          <p className="sr-only" id="legal-footer-links-hint">Arrow keys move between related legal links, free tools and draft. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="legal-footer__links" aria-label="Related legal pages" aria-describedby="legal-footer-links-hint">
            <Link href={other.href} className="legal-link-btn" scroll={false}>
              View {other.label}
              <span aria-hidden="true">→</span>
            </Link>
            {document.slug === "privacy" && (
              <Link href="/grievance-redressal" className="legal-link-btn" scroll={false}>
                Grievance redressal
                <span aria-hidden="true">→</span>
              </Link>
            )}
            <Link href="/cookie-policy" className="legal-link-btn" scroll={false}>
              Cookie policy
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/tools" className="legal-link-btn" scroll={false}>
              Free tools
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/guidance/start" className="legal-link-btn" scroll={false}>
              Prepare a draft
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/contact" className="legal-link-btn" scroll={false}>
              Contact support
              <span aria-hidden="true">→</span>
            </Link>
          </LinkKeyboardGroup>
          <aside className="notice offer-notice" role="status" aria-label="Booking availability" style={{ marginTop: 18 }}>
            <p>
              <strong>Want a note when No Timer opens?</strong> This waitlist is separate from legal or privacy questions.{' '}
              <span className="sr-only" id="legal-footer-notify-hint">Arrow keys move between how booking works, free tools and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</span>
              <LinkKeyboardGroup as="span" aria-label="Legal footer booking updates" aria-describedby="legal-footer-notify-hint">
                <Link href="/how-it-works#booking-availability-how">How booking will work</Link>
                {' · '}
                <Link href="/tools">Try free tools</Link>
                {' · '}
                <Link href="/guidance/start">Prepare a draft</Link>
              </LinkKeyboardGroup>
            </p>
            <NotifyOpenForm
              source={document.slug === "privacy" ? "website_privacy_policy" : "website_terms"}
              helpText="Booking-open emails only — separate from legal or privacy replies. See our"
            />
          </aside>
        </div>
      </footer>
    </main>
  );
}
