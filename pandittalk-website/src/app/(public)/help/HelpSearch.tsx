'use client';

import Link from 'next/link';
import { useId, useMemo, useRef, useState } from 'react';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { supportEmail } from '@/content/siteIdentity';

export type HelpTopic = {
  slug: string;
  label: string;
  description: string;
  keywords?: string;
};

export function HelpSearch({ topics }: { topics: HelpTopic[] }) {
  const fieldId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!needle) return topics;
    const parts = needle.split(' ').filter(Boolean);
    return topics.filter(topic => {
      const haystack = `${topic.label} ${topic.description} ${topic.keywords || ''} ${topic.slug}`.toLowerCase();
      return parts.every(part => haystack.includes(part));
    });
  }, [query, topics]);

  const hasQuery = query.trim().length > 0;
  const listId = `${fieldId}-results`;

  function clearSearch() {
    setQuery('');
    inputRef.current?.focus();
  }

  function focusFirstResult() {
    const first = document.querySelector<HTMLAnchorElement>(`#${CSS.escape(listId)} a[href]`);
    first?.focus();
  }

  return (
    <div className="help-search stack" role="search">
      <label className="field" htmlFor={fieldId}>
        Search help topics
        <input
          ref={inputRef}
          id={fieldId}
          type="search"
          value={query}
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g. payment, reconnect, OTP…"
          aria-describedby={`${statusId} help-search-keyboard-hint`}
          aria-controls={listId}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Escape' && query) {
              event.preventDefault();
              clearSearch();
              return;
            }
            if (event.key === 'Enter' && hasQuery && filtered.length === 0) {
              event.preventDefault();
              requestAnimationFrame(() => emptyRef.current?.focus());
              return;
            }
            if ((event.key === 'ArrowDown' || event.key === 'Enter') && hasQuery && filtered.length > 0) {
              event.preventDefault();
              focusFirstResult();
            }
          }}
        />
      </label>
      {hasQuery && (
        <>
          <p className="sr-only" id="help-search-controls-hint">Arrow keys move between Clear, Jump, free tools and draft. Escape clears the search from the field. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" style={{ marginTop: 0 }} aria-label="Help search controls" aria-describedby="help-search-controls-hint">
            <button type="button" className="text-link" onClick={clearSearch}>
              Clear search
            </button>
            {filtered.length > 0 && (
              <button type="button" className="text-link" onClick={focusFirstResult}>
                Jump to first match
              </button>
            )}
            <Link className="text-link" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </>
      )}
      <p id={statusId} className="expert-meta" role="status" aria-live="polite">
        {hasQuery
          ? filtered.length === 0
            ? 'No matching topics. Try another word, browse all topics below after clearing, or contact support.'
            : `${filtered.length} topic${filtered.length === 1 ? '' : 's'} match your search.`
          : `${topics.length} topics · browse or type to filter.`}
      </p>
      <p className="sr-only" id="help-search-keyboard-hint">Press Enter or Arrow Down to jump to the first match. Arrow Up from the first result returns to search. Escape clears the search.</p>
      {filtered.length === 0 ? (
        <div className="panel stack" role="status" id={listId} ref={emptyRef} tabIndex={-1} onKeyDown={event => {
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            inputRef.current?.focus();
            return;
          }
          if (event.key !== 'Escape' || !hasQuery) return;
          event.preventDefault();
          clearSearch();
        }}>
          <p>Nothing matched “{query.trim()}”. Try another search, browse all topics, or contact support.</p>
          <p className="sr-only" id="help-search-empty-hint">Arrow keys move between recovery actions including free tools and draft. Escape clears the search. Up arrow returns to the search field. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Help search empty recovery" aria-describedby="help-search-empty-hint">
            <Link className="button secondary" href="/contact">Contact support</Link>
            <a
              className="button secondary"
              href={`mailto:${supportEmail}?subject=${encodeURIComponent('Help topic search')}&body=${encodeURIComponent(`I searched help for: ${query.trim()}\n\nWhat I need:\n`)}`}
            >
              Email support about this search
              <span className="sr-only"> (opens your email app)</span>
            </a>
            <Link className="button secondary" href="/help/account-access">Account access help</Link>
            <Link className="button secondary" href="/help/coins-and-payment-pending">Payment help</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
            <button type="button" className="button secondary" onClick={clearSearch}>Show all topics</button>
          </LinkKeyboardGroup>
        </div>
      ) : (
        <nav
          className="info-help-grid"
          aria-label="Help topics"
          id={listId}
          onKeyDown={event => {
            if (!(event.target instanceof HTMLAnchorElement)) return;
            const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[href]'));
            const index = links.indexOf(event.target);
            if (index < 0) return;
            let next = index;
            if (event.key === 'ArrowUp' && index === 0) {
              event.preventDefault();
              inputRef.current?.focus();
              return;
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % links.length;
            else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + links.length) % links.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = links.length - 1;
            else if (event.key === 'Escape' && hasQuery) {
              event.preventDefault();
              clearSearch();
              return;
            } else return;
            event.preventDefault();
            links[next]?.focus();
          }}
        >
          {filtered.map(topic => (
            <Link className="panel info-help-link" key={topic.slug} href={`/help/${topic.slug}`}>
              <span>
                <strong>{topic.label}</strong>
                <small>{topic.description}</small>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
