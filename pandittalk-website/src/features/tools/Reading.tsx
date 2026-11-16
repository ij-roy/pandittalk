'use client';

import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { record, text } from './schemas';
const labels: Record<string,string> = { lifeNarrative:'Your life narrative', todayInsight:"Today's insight", emotionalCompatibility:'Emotional connection', communication:'Communication', longTermHarmony:'Long-term harmony', gunaMilan:'Guna Milan', strengths:'Strengths', challenges:'Challenges', marriageOutlook:'Marriage outlook', coupleNarrative:'Your relationship narrative', monthlyOverview:'Monthly overview', career:'Career', relationships:'Relationships', health:'Wellbeing', keyOpportunities:'Key opportunities', cardMeaning:'Card meaning', yourInsight:'Your insight' };
const value = (v: unknown) => text(v);
const array = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const humanKey = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();

export function Reading({ data, live = true }: { data: Record<string, unknown>; live?: boolean }) {
  const planets = array(data.planets).map(record);
  const dasha = data.currentDasha ?? data.dasha;
  const personName = [text(data.firstName), text(data.lastName)].filter(Boolean).join(' ').trim();
  const personDob = text(data.dob) || text(data.dateOfBirth);
  return (
    <div className="stack" id={live ? 'reading-live-result' : 'reading-saved-result'}>
      {live && <p className="sr-only" role="status" aria-live="polite">Your reading is ready. Scroll down for the full interpretation.</p>}
      <p className="eyebrow">Automated reading · for reflection</p>
      {personName && <h3>{personName}{personDob ? ` · ${personDob}` : ''}</h3>}
      {text(data.cardName) && <h3>{value(data.cardName)}</h3>}
      {typeof data.score === 'number' && <p className="lede">Compatibility score: {data.score}. A number does not decide a relationship.</p>}
      {planets.length > 0 && (
        <section className="panel">
          <h3>Birth chart · planets by house</h3>
          <div className="grid kundli-houses" aria-label="Twelve houses">
            {Array.from({ length: 12 }, (_, i) => (
              <div className="panel" key={i}>
                <h4>House {i + 1}</h4>
                {planets.filter(p => p.house === i + 1).map((p, j) => (
                  <p key={j}>{value(p.name)} · {value(p.sign)} · {value(p.degree)}°</p>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
      {Object.entries(labels).map(([key, label]) => text(data[key]) ? <section className="panel" key={key}><h3>{label}</h3><p>{value(data[key])}</p></section> : null)}
      {['lifeLine', 'heartLine', 'headLine'].map(key => data[key] ? (
        <section className="panel" key={key}>
          <h3>{typeof data[key] === 'string' ? key.replace('Line', ' line').replace(/^./, c => c.toUpperCase()) : value(record(data[key]).title)}</h3>
          <p>{typeof data[key] === 'string' ? value(data[key]) : value(record(data[key]).description)}</p>
          {key === 'lifeLine' && <p className="expert-meta">Palm lines are symbolic only — not a medical reading, diagnosis, or prediction of lifespan.</p>}
        </section>
      ) : null)}
      {Boolean(data.lifeLine || data.heartLine || data.headLine) && (
        <aside className="notice" role="note" tabIndex={-1} onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).blur();
        }}>
          <strong>Not medical advice.</strong> Palm interpretations on Pandit Talk are for reflection only and do not assess health, lifespan, or clinical outcomes. See the{' '}
          <span className="sr-only" id="reading-palm-disclaimer-hint">Arrow keys move to the disclaimer link. Escape blurs. Skip remains site-content.</span>
          <LinkKeyboardGroup as="span" aria-label="Palm reading disclaimer" aria-describedby="reading-palm-disclaimer-hint">
            <Link href="/disclaimer">disclaimer</Link>
          </LinkKeyboardGroup>
          . Press Escape to leave this note.
        </aside>
      )}
      {['doshas', 'doshaCompatibility', 'remedies'].map(key => array(data[key]).length > 0 ? (
        <section className="panel" key={key}>
          <h3>{key === 'remedies' ? 'Suggested practices' : 'Traditional dosha interpretation'}</h3>
          {key === 'remedies' && <p className="expert-meta">These are traditional ideas for reflection — not medical, legal or financial prescriptions.</p>}
          {array(data[key]).map((v, i) => {
            const r = record(v);
            return (
              <div key={i}>
                <h4>{value(r.name ?? r.title)} {typeof r.present === 'boolean' ? r.present ? '— indicated' : '— not indicated' : ''}</h4>
                <p>{value(r.severity)} {value(r.description)}</p>
              </div>
            );
          })}
        </section>
      ) : null)}
      {dasha != null && (
        <section className="panel">
          <h3>Current dasha</h3>
          {Object.entries(record(dasha)).map(([k, v]) => <p key={k}>{humanKey(k)}: {value(v)}</p>)}
        </section>
      )}
      {data.luckyElements != null && (
        <section className="panel">
          <h3>Traditional lucky elements</h3>
          {Object.entries(record(data.luckyElements)).map(([k, v]) => <p key={k}>{humanKey(k)}: {value(v)}</p>)}
        </section>
      )}
      {text(data.luckyColor) && (
        <section className="panel">
          <h3>Today&apos;s elements</h3>
          <p>Color: {value(data.luckyColor)} · Time: {value(data.luckyTime)} · Number: {value(data.luckyNumber)}</p>
          <p>{text(data.disclaimer) || 'Lucky color, time and number are generative suggestions for reflection — not predictions or guarantees.'}</p>
          <p>The provider does not return a forecast date or timezone. Confirm context before relying on this reading.</p>
        </section>
      )}
      <p className="notice" role="status" tabIndex={-1} onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }}>These interpretations are not guarantees, diagnoses, lifespan predictions, or professional advice. A Pandit can help you reflect on what is useful in a timed session or Chat Now. See the{' '}
        <span className="sr-only" id="reading-general-disclaimer-hint">Arrow keys move to the disclaimer link. Escape blurs. Skip remains site-content.</span>
        <LinkKeyboardGroup as="span" aria-label="Reading disclaimer" aria-describedby="reading-general-disclaimer-hint">
          <Link href="/disclaimer">disclaimer</Link>
        </LinkKeyboardGroup>
        . Press Escape to leave this notice.</p>
      <p className="expert-meta no-print">Tip: use your browser’s print or Save as PDF if you want a copy for yourself. Nothing is emailed automatically. Printing does not create a booking or charge.</p>
      <p className="sr-only" id={live ? 'reading-next-hint-live' : 'reading-next-hint-saved'}>Arrow keys move between next-step links. Escape blurs. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions no-print" aria-label="After your reading" aria-describedby={live ? 'reading-next-hint-live' : 'reading-next-hint-saved'}>
        <Link className="button secondary" href="/guidance/start">Prepare a private draft</Link>
        <Link className="button secondary" href="/guidance">Explore human guidance</Link>
        <Link className="button secondary" href="/tools">More free tools</Link>
        <Link className="text-link" href="/pandits">Explore Pandits →</Link>
        <Link className="text-link" href="/disclaimer">Read the disclaimer →</Link>
        <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
        <Link className="text-link" href="/contact">Contact support →</Link>
        {live ? null : <Link className="text-link" href="/reports">All saved reports →</Link>}
      </LinkKeyboardGroup>
    </div>
  );
}
