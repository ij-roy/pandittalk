'use client';

import type { Components } from 'react-markdown';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';

function blurOnEscape(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  event.currentTarget.blur();
}

function safeHref(href?: string) {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (!trimmed) return undefined;
  // Protocol-relative URLs (`//evil.example`) must not be treated as site paths.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  if (trimmed.startsWith('#') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return undefined;
}

function createComponents() {
  let tableCount = 0;
  const components: Components = {
    a: ({ href, children }) => {
      const safe = safeHref(href);
      if (!safe) return <span>{children}</span>;
      const external = safe.startsWith('http');
      const internal = safe.startsWith('/') && !safe.startsWith('//');
      if (internal) {
        return <Link href={safe}>{children}</Link>;
      }
      return (
        <a
          href={safe}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
          {children}
          {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
        </a>
      );
    },
    img: ({ src, alt }) => {
      const url = typeof src === 'string' ? src.trim() : '';
      if (!url || url.startsWith('javascript:') || url.startsWith('data:text')) {
        return alt?.trim() ? <span>{alt}</span> : null;
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt?.trim() ? alt : 'Article illustration'}
          loading="lazy"
          decoding="async"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      );
    },
    h1: ({ children }) => <h2>{children}</h2>,
    h2: ({ children }) => <h3>{children}</h3>,
    h3: ({ children }) => <h4>{children}</h4>,
    p: ({ children }) => <p>{children}</p>,
    ul: ({ children }) => <ul>{children}</ul>,
    ol: ({ children }) => <ol>{children}</ol>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
    hr: () => <hr />,
    th: ({ children }) => <th scope="col">{children}</th>,
    table: ({ children }: { children?: ReactNode }) => {
      tableCount += 1;
      return (
        <div
          className="journal-table-wrap"
          role="region"
          aria-label={`Article table ${tableCount}. On small screens, swipe sideways to read every column. Press Escape to leave the table.`}
          tabIndex={0}
          onKeyDown={blurOnEscape}
        >
          <table>{children}</table>
        </div>
      );
    },
    pre: ({ children }: { children?: ReactNode }) => (
      <pre tabIndex={0} onKeyDown={blurOnEscape}>
        {children}
      </pre>
    ),
  };
  return components;
}

export function MarkdownBody({ content }: { content: string }) {
  const body = content?.trim() ? content : '';
  const emptyRef = useRef<HTMLDivElement>(null);
  const sawEmpty = useRef(false);

  useEffect(() => {
    if (body) {
      sawEmpty.current = false;
      return;
    }
    if (sawEmpty.current) return;
    sawEmpty.current = true;
    requestAnimationFrame(() => emptyRef.current?.focus());
  }, [body]);

  if (!body) {
    return (
      <div
        ref={emptyRef}
        className="journal-prose stack"
        role="status"
        tabIndex={-1}
        onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}
      >
        <p className="expert-meta">This article has no readable body yet. The title and byline are still here — nothing is wrong with your account. Reading the journal never creates a booking or charge. Press Escape to leave this notice.</p>
        <p className="sr-only" id="empty-article-body-hint">Arrow keys move between journal, free tools, draft, booking updates and support. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Empty article body next steps" aria-describedby="empty-article-body-hint">
          <Link className="button secondary" href="/articles">Browse the journal</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
          <Link className="text-link" href="/contact">Contact support →</Link>
        </LinkKeyboardGroup>
      </div>
    );
  }
  return (
    <div className="journal-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={createComponents()}>
        {body}
      </ReactMarkdown>
    </div>
  );
}
