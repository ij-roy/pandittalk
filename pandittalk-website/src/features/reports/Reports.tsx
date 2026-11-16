'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '@/lib/api/client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { LoadingState } from '@/components/site/Skeleton';
import { Reading } from '../tools/Reading';
import { validateResult } from '../tools/schemas';
import { parseReport } from './schema';
import { formatIstDate, formatIstDateTime } from '@/lib/time/ist';
import styles from '../account/customer.module.css';

const reportTypeLabels: Record<string, string> = {
  detailed_kundli: 'Detailed Kundli',
  detailed_compatibility: 'Detailed compatibility',
  kundli: 'Kundli',
  compatibility: 'Compatibility',
  horoscope: 'Horoscope',
  tarot: 'Tarot',
  'palm-reading': 'Palm reading',
  monthly_horoscope: 'Monthly horoscope',
};

function reportLabel(type: string) {
  return reportTypeLabels[type] || type.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
}

export default function Reports({ id }: { id?: string }) {
  const state = useApi<unknown>(id ? '/reports/' + encodeURIComponent(id) : '/reports');
  const errorRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLElement>(null);
  const printNoteRef = useRef<HTMLParagraphElement>(null);
  const [printNote, setPrintNote] = useState('');
  const sawEmpty = useRef(false);
  let content; let invalid = '';
  let listEmpty = false;
  try {
    if (state.data !== undefined) {
      if (id) {
        const r = parseReport(state.data);
        const payload = validateResult(r.type === 'detailed_kundli' ? 'kundli' : r.type === 'detailed_compatibility' ? 'compatibility' : r.type, r.payload);
        content = <>
          <section className="panel stack" aria-labelledby="report-detail-title">
            <p className="eyebrow">{reportLabel(r.type)}</p>
            <h2 id="report-detail-title">{r.title}</h2>
            <p>{r.inputSummary}</p>
            <p><time dateTime={r.createdAt}>{formatIstDateTime(r.createdAt)}</time> · {r.coinsSpent} coins paid</p>
            <LinkKeyboardGroup className="actions no-print" aria-label="Report print and tools" aria-describedby="report-print-help report-print-keys">
              <button
                className="button secondary"
                type="button"
                aria-describedby="report-print-help"
                onClick={() => {
                  window.print();
                  setPrintNote('Print dialog opened. Choose “Save as PDF” if you want a file copy — reopening this report does not charge coins.');
                  requestAnimationFrame(() => printNoteRef.current?.focus());
                }}
              >
                Print or save as PDF
              </button>
              <Link className="button secondary" href="/tools">Try a free tool</Link>
              <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
              <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
            </LinkKeyboardGroup>
            <p className="sr-only" id="report-print-keys">Arrow keys move between Print, free tools, draft and booking updates. Escape blurs. Skip remains site-content.</p>
            <p className="expert-meta no-print" id="report-print-help">Uses your browser print dialog. Choose “Save as PDF” if you want a file copy. Reopening this report does not charge coins. Press Escape to dismiss the print status.</p>
            {printNote && <p className="notice no-print" role="status" tabIndex={-1} ref={printNoteRef} aria-live="polite" onKeyDown={event => {
              if (event.key !== 'Escape') return;
              event.preventDefault();
              setPrintNote('');
            }}>{printNote} Press Escape to dismiss.</p>}
          </section>
          <Reading data={payload} live={false} />
        </>;
      } else {
        if (!Array.isArray(state.data)) throw new Error('Your reports could not be read. Please try again.');
        const rows = state.data.map(parseReport);
        listEmpty = rows.length === 0;
        content = rows.length ? <div className="grid" role="list" aria-label="Saved reports" aria-describedby="reports-grid-hint" onKeyDown={event => {
          if (!(event.target instanceof HTMLAnchorElement)) return;
          const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[href]'));
          const index = links.indexOf(event.target);
          if (index < 0) return;
          if (event.key === 'Escape') { event.preventDefault(); event.target.blur(); return; }
          let next = index;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % links.length;
          else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + links.length) % links.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = links.length - 1;
          else return;
          event.preventDefault();
          links[next]?.focus();
        }}>{rows.map(r => <Link className="panel stack" role="listitem" key={r.id} href={'/reports/' + encodeURIComponent(r.id)} aria-label={`Open ${reportLabel(r.type)} report: ${r.title}`}><p className="eyebrow">{reportLabel(r.type)}</p><h2>{r.title}</h2><p>{r.inputSummary}</p><small><time dateTime={r.createdAt}>{formatIstDate(r.createdAt)}</time> · {r.coinsSpent} coins paid</small><span className="text-link">Read report →</span></Link>)}</div> : <section className={`panel stack ${styles.empty}`} role="status" tabIndex={-1} ref={emptyRef} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}><h2>No saved reports yet</h2><p>Saved paid reports will appear here. New detailed-report purchases are paused — free tools are still open, and reopening a saved report never charges again. Press Escape to leave this notice.</p><p className="sr-only" id="reports-empty-hint">Arrow keys move between empty-reports recovery links. Escape blurs the focused link. Skip remains site-content.</p><LinkKeyboardGroup className="actions" aria-label="Empty reports recovery" aria-describedby="reports-empty-hint"><Link className="button" href="/tools">Explore free tools</Link><Link className="button secondary" href="/guidance/start">Prepare an optional note</Link><Link className="button secondary" href="/tools/kundli/detailed">Why detailed reports are paused</Link><Link className="button secondary" href="/pandits">Explore Pandits</Link><Link className="text-link" href="/pandits">Choose a Pandit →</Link></LinkKeyboardGroup></section>;
        if (rows.length) content = <>{content}<p className="sr-only" id="reports-grid-hint">Arrow keys move between saved reports. Home and End jump to the first or last report. Escape blurs the focused report. Skip remains site-content.</p></>;
      }
    }
  } catch (e) { invalid = e instanceof Error ? e.message : 'This report is unavailable.'; }
  const missing = Boolean(id && (invalid || state.error) && /404|not found/i.test(invalid || state.error?.message || ''));
  const showError = Boolean((state.error || invalid) && !missing);
  useEffect(() => {
    if (!showError && !missing) return;
    requestAnimationFrame(() => {
      if (missing) document.getElementById('report-missing-title')?.focus();
      else errorRef.current?.focus();
    });
  }, [showError, missing, state.error, invalid]);
  useEffect(() => {
    if (!listEmpty) {
      sawEmpty.current = false;
      return;
    }
    if (sawEmpty.current) return;
    sawEmpty.current = true;
    requestAnimationFrame(() => emptyRef.current?.focus());
  }, [listEmpty]);
  return <main id="main-content" className="page stack reports-page" aria-busy={state.loading || undefined}>
    {id && <Link className="text-link" href="/reports">← All saved reports</Link>}
    <div className={styles.toolbar}>
      <div>
        <p className="eyebrow">Private to your account</p>
        <h1>{id ? 'Your report' : 'Saved reports'}</h1>
        <p className="lede">{id ? 'Take your time with your reading. Reopening it does not charge any coins.' : 'A place to revisit your readings. Open an existing report at no extra charge. New detailed purchases stay paused on the website.'}</p>
      </div>
      <p className="sr-only" id="reports-toolbar-hint">Arrow keys move between Refresh, free tools and draft. Escape blurs. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" style={{ margin: 0 }} aria-label="Reports toolbar" aria-describedby="reports-toolbar-hint">
        <button className="button secondary" type="button" onClick={state.reload} disabled={state.loading} aria-busy={state.loading || undefined}>{state.loading ? 'Refreshing…' : id ? 'Refresh report' : 'Refresh reports'}</button>
        <Link className="text-link" href="/tools">Free tools</Link>
        <Link className="text-link" href="/guidance/start">Prepare a draft</Link>
      </LinkKeyboardGroup>
    </div>
    {state.loading && <>
      <LoadingState label={id ? 'Loading your report…' : 'Loading your saved reports…'} variant={id ? 'detail' : 'cards'} />
      <p className="sr-only" id="reports-loading-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft if loading takes longer than expected.</p>
      <LinkKeyboardGroup className="actions" aria-label="While reports load" aria-describedby="reports-loading-hint">
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
      </LinkKeyboardGroup>
    </>}
    {missing && <section className={`panel stack ${styles.empty}`} role="status" onKeyDown={event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      (document.getElementById('report-missing-title') as HTMLElement | null)?.blur();
    }}>
      <h2 id="report-missing-title" tabIndex={-1}>Report not found</h2>
      <p>This report is unavailable, was removed, or is not linked to your account. Opening this link does not purchase a new report — new detailed purchases stay paused. Press Escape to leave this heading.</p>
      <p className="sr-only" id="reports-missing-hint">Arrow keys move between missing-report recovery links. Escape blurs the focused link. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Missing report recovery" aria-describedby="reports-missing-hint">
        <Link className="button" href="/reports">All saved reports</Link>
        <Link className="button secondary" href="/tools">Free tools</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="text-link" href="/contact">Contact support →</Link>
      </LinkKeyboardGroup>
    </section>}
    {showError && <div className="error" role="alert" tabIndex={-1} ref={errorRef} onKeyDown={event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      (event.currentTarget as HTMLElement).blur();
    }}>
      <p>{invalid || state.error?.message} Press Escape to leave this alert.</p>
      <p className="sr-only" id="reports-load-hint">Arrow keys move between report load recovery links. Escape blurs the focused control. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Report load recovery" aria-describedby="reports-load-hint">
        <button type="button" className="button secondary" onClick={state.reload} disabled={state.loading} aria-busy={state.loading || undefined}>{state.loading ? 'Trying again…' : 'Try again'}</button>
        <Link className="button secondary" href="/tools">Free tools</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="text-link" href="/contact">Contact support →</Link>
      </LinkKeyboardGroup>
    </div>}
    {content}
    {!id && !state.loading && !missing && (
      <>
        <p className="sr-only" id="reports-shortcuts-hint">Arrow keys move between reports shortcuts. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Reports shortcuts" aria-describedby="reports-shortcuts-hint">
          <Link className="text-link" href="/tools">Browse free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/wallet">Check wallet →</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
        </LinkKeyboardGroup>
      </>
    )}
  </main>;
}
