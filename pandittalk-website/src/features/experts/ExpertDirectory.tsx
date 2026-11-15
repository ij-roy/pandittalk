'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { useApi } from '@/lib/api/client';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { categories, expertFirstName, filterExperts, presenceLabel, trustworthyReviewStats, type Expert } from './types';

export function ExpertPortrait({ expert }: { expert: Expert }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  return expert.image_url && expert.image_url !== failedUrl
    ? <img className="expert-avatar" src={expert.image_url} alt={`Portrait of ${expert.name}`} width={80} height={96} loading="lazy" decoding="async" onError={() => setFailedUrl(expert.image_url || undefined)} />
    : <span className="expert-avatar portrait-fallback" role="img" aria-label={`Initial for ${expert.name}`}>{expert.name.trim().slice(0, 1)}</span>;
}

function LoadingRows({ count = 3 }: { count?: number }) {
  return <div className="expert-loading" aria-hidden="true">
    {Array.from({ length: count }, (_, index) => <div className="expert-row expert-row-skeleton" key={index}>
      <span className="expert-avatar skeleton-block" />
      <div className="skeleton-copy"><span className="skeleton-line" /><span className="skeleton-line short" /><span className="skeleton-line shorter" /></div>
      <span className="skeleton-button skeleton-block" />
    </div>)}
  </div>;
}

export function ExpertDirectory({ compact = false }: { compact?: boolean }) {
  const filtersId = useId();
  const searchId = `${filtersId}-search`;
  const areaId = `${filtersId}-area`;
  const languageId = `${filtersId}-language`;
  const sortId = `${filtersId}-sort`;
  const resultsId = `${filtersId}-results`;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [area, setArea] = useState('');
  const [language, setLanguage] = useState('');
  const [sort, setSort] = useState('rating');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const filterToggleRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!filtersOpen) return;
    requestAnimationFrame(() => document.getElementById(searchId)?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') && (target as HTMLInputElement).value) {
        if (target.id === searchId && search) {
          setSearch('');
          setDebouncedSearch('');
          return;
        }
      }
      setFiltersOpen(false);
      requestAnimationFrame(() => filterToggleRef.current?.focus());
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [filtersOpen, searchId, search]);
  const params = new URLSearchParams();
  if (debouncedSearch) params.set('search', debouncedSearch);
  if (area) params.set('area', area);
  const { data, error, loading, reload } = useApi<Expert[]>('/experts?' + params.toString());
  const rows = Array.isArray(data) ? data : [];
  const lastRows = useRef<Expert[]>([]);
  if (rows.length || (!loading && !error)) lastRows.current = rows;
  const displayRows = rows.length || (!loading && !error) ? rows : lastRows.current;
  const languages = Array.from(new Set(displayRows.flatMap(expert => expert.languages))).sort();
  const filtered = filterExperts(displayRows, language, sort);
  const debouncing = search.trim() !== debouncedSearch;
  const searching = loading && displayRows.length === 0;
  const updating = (loading || debouncing) && displayRows.length > 0;
  const hasFilters = !!search || !!area || !!language || sort !== 'rating';
  const activeFilterCount = [search, area, language, sort !== 'rating' ? sort : ''].filter(Boolean).length;
  const showLoadError = Boolean(error && displayRows.length === 0);

  useEffect(() => {
    if (!searching) {
      setLoadingSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setLoadingSlow(true), 1200);
    return () => window.clearTimeout(timer);
  }, [searching]);

  useEffect(() => {
    if (!showLoadError) return;
    requestAnimationFrame(() => errorRef.current?.focus());
  }, [showLoadError, error]);

  useEffect(() => {
    if (!hasFilters || searching || updating || showLoadError || filtered.length > 0) return;
    requestAnimationFrame(() => document.getElementById('directory-empty')?.focus());
  }, [filtered.length, searching, updating, showLoadError, hasFilters, search, language, sort, area]);

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setArea('');
    setLanguage('');
    setSort('rating');
    setFiltersOpen(true);
    requestAnimationFrame(() => document.getElementById(searchId)?.focus());
  }

  const filterControls = <>
    <label className="field" htmlFor={searchId}>Name or practice<input id={searchId} value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => {
      if (event.key === 'Escape' && search) {
        event.preventDefault();
        setSearch('');
        setDebouncedSearch('');
        requestAnimationFrame(() => document.getElementById(resultsId)?.focus());
      }
    }} type="search" placeholder="Search for a Pandit…" autoComplete="off" enterKeyHint="search" aria-describedby={resultsId} /></label>
    <label className="field" htmlFor={areaId}>Topic<select id={areaId} value={area} onChange={event => setArea(event.target.value)} onKeyDown={event => {
      if (event.key !== 'Escape' || !area) return;
      event.preventDefault();
      setArea('');
    }}><option value="">All topics</option>{categories.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
    <label className="field" htmlFor={languageId}>Language<select id={languageId} value={language} disabled={searching} onChange={event => setLanguage(event.target.value)} onKeyDown={event => {
      if (event.key !== 'Escape' || !language) return;
      event.preventDefault();
      setLanguage('');
    }}><option value="">All listed languages</option>{language && !languages.includes(language) && <option value={language}>{language}</option>}{languages.map(item => <option key={item}>{item}</option>)}</select></label>
    <label className="field" htmlFor={sortId}>Sort by<select id={sortId} value={sort} onChange={event => setSort(event.target.value)} onKeyDown={event => {
      if (event.key !== 'Escape' || sort === 'rating') return;
      event.preventDefault();
      setSort('rating');
    }}><option value="rating">Rating: highest first</option><option value="reviews">Review count: highest first</option><option value="experience">Experience: highest first</option><option value="name">Name A–Z</option></select></label>
  </>;

  return <div>
    {!compact && <>
      <div className="filters-toolbar">
        <p className="sr-only" id="directory-filters-toolbar-hint">Arrow keys move between Filter, Clear, free tools and draft. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" style={{ margin: 0 }} aria-label="Directory filter controls" aria-describedby="directory-filters-toolbar-hint">
          <button
            ref={filterToggleRef}
            type="button"
            className="button secondary filters-toggle"
            aria-label={activeFilterCount > 0 ? `Filter and sort, ${activeFilterCount} active` : 'Filter and sort'}
            aria-expanded={filtersOpen}
            aria-controls={filtersId}
            onClick={() => setFiltersOpen(open => !open)}
          >
            {filtersOpen ? 'Hide filters' : 'Filter & sort'}
            {activeFilterCount > 0 && <span className="filters-count" aria-hidden="true">{activeFilterCount}</span>}
          </button>
          {hasFilters && <button type="button" className="button secondary" onClick={clearFilters}>Clear filters</button>}
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
        {hasFilters && !filtersOpen && (
          <p className="expert-meta" id={`${filtersId}-active`} role="status">
            Active: {[
              search.trim() ? `“${search.trim()}”` : '',
              area ? (categories.find(([id]) => id === area)?.[1] || area) : '',
              language || '',
              sort !== 'rating' ? (sort === 'name' ? 'Name A–Z' : sort === 'reviews' ? 'Most reviews' : sort === 'experience' ? 'Most experience' : '') : '',
            ].filter(Boolean).join(' · ')}
          </p>
        )}
        {!filtersOpen && <>
          <p className="expert-meta" id={`${filtersId}-hint`}>Use Filter &amp; sort to search by name, topic or language.</p>
          <p className="sr-only" id={`${filtersId}-hint-keyboard`}>Press Escape in search to clear it, Escape on a filter select to reset it, or Escape while filters are open to hide them and return focus to the filter control.</p>
        </>}
      </div>
      <div className={`filters${filtersOpen ? ' is-open' : ''}`} id={filtersId} aria-describedby={!filtersOpen ? `${filtersId}-hint ${filtersId}-hint-keyboard` : undefined}>
        {filterControls}
        <p className="sr-only" id="directory-filters-panel-hint">Arrow keys move between Clear filters, free tools and draft. Escape blurs. Skip remains site-content.</p>
        <LinkKeyboardGroup className="filters-actions actions" aria-label="Directory filter panel actions" aria-describedby="directory-filters-panel-hint">
          <button type="button" className="button secondary" disabled={!hasFilters} onClick={clearFilters}>Clear filters</button>
          <Link className="text-link" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft</Link>
        </LinkKeyboardGroup>
      </div>
      <p className="expert-meta expert-directory-note">App presence does not open a booking on this website. Health, financial and legal topics offer spiritual guidance, not professional advice.</p>
    </>}
    <div aria-busy={searching || updating}>
      {updating && <p role="status" className="expert-meta">Updating results…</p>}
      {searching ? <>
        <p id={resultsId} role="status" className="expert-meta">Finding Pandits…</p>
        {loadingSlow && <div className="expert-loading-help" role="status">
          <p>Still loading? You can use free tools or prepare a draft while profiles load.</p>
          <div className="actions" style={{ marginTop: 10 }}>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </div>
        </div>}
        <p className="sr-only" id="directory-searching-hint">Skip to content still targets site-content. Arrow keys move between free tools and draft while results load. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" aria-label="While Pandit results load" aria-describedby="directory-searching-hint">
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
        </LinkKeyboardGroup>
        <LoadingRows count={compact ? 3 : 4} />
      </> : showLoadError ? <div className="error" role="alert" tabIndex={-1} ref={errorRef} onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }}>
        <p id={resultsId}>We couldn&apos;t load the Pandit directory. Please try again. Press Escape to leave this alert.</p>
        <p className="sr-only" id="directory-load-hint">Arrow keys move between directory load recovery links. Escape blurs the focused control. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Directory load recovery" style={{ marginTop: 12 }} aria-describedby="directory-load-hint">
          <button type="button" className="button secondary" onClick={reload} disabled={loading} aria-busy={loading || undefined}>{loading ? 'Trying again…' : 'Try again'}</button>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/contact">Contact support →</Link>
        </LinkKeyboardGroup>
      </div> : <>
        {compact ? (
          <p id={resultsId} role="status" className="expert-meta" tabIndex={-1}>
            {filtered.length === 0
              ? 'No Pandits to preview right now.'
              : `Showing ${Math.min(3, filtered.length)} of ${filtered.length} ${filtered.length === 1 ? 'Pandit' : 'Pandits'} · New bookings paused`}
          </p>
        ) : (
          <p id={resultsId} role="status" className="expert-meta" tabIndex={-1}>{filtered.length} {filtered.length === 1 ? 'Pandit' : 'Pandits'} · Sorted by {sort === 'name' ? 'name A–Z' : sort === 'reviews' ? 'review count, highest first' : sort === 'experience' ? 'experience, highest first' : 'rating, highest first'} · New bookings paused</p>
        )}
        {filtered.length === 0 ? <div className="panel stack" id="directory-empty" tabIndex={-1} role="status" onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          if (hasFilters) {
            clearFilters();
            requestAnimationFrame(() => document.getElementById(resultsId)?.focus());
            return;
          }
          (event.currentTarget as HTMLElement).blur();
        }}>
          <h3>{hasFilters ? 'No matching Pandits right now.' : 'No Pandit profiles to show right now.'}</h3>
          <p>{hasFilters ? 'Try a different name, topic or language to find a profile to prepare with. New bookings stay paused. Press Escape to clear filters.' : 'The directory has no public profiles to show right now. You can still prepare a draft or leave your email for updates — that does not open a booking or charge coins. Press Escape to leave this notice.'}</p>
          {hasFilters ? <>
            <p className="sr-only" id="directory-filtered-empty-hint">Arrow keys move between Clear filters, free tools and draft. Escape blurs. Skip remains site-content. NotifyOpenForm still requires source.</p>
            <LinkKeyboardGroup className="actions" aria-label="Directory filtered empty recovery" aria-describedby="directory-filtered-empty-hint">
              <button type="button" className="button secondary" onClick={clearFilters}>Clear all filters</button>
              <Link href="/tools" className="button secondary">Try free tools</Link>
              <Link href="/guidance/start" className="text-link">Prepare a draft →</Link>
            </LinkKeyboardGroup>
          </> : <>
            <p className="sr-only" id="directory-empty-hint">Arrow keys move between empty-directory next steps including free tools, draft and booking updates. Escape blurs.</p>
            <LinkKeyboardGroup className="actions" aria-label="Directory empty next steps" aria-describedby="directory-empty-hint">
              <Link href="/guidance/start" className="button secondary">Prepare a draft</Link>
              <Link href="/tools" className="button secondary">Try free tools</Link>
              <Link href="/how-it-works#booking-availability-how" className="text-link">Get a note when booking opens →</Link>
              <Link href="/contact" className="text-link">Contact support →</Link>
            </LinkKeyboardGroup>
            <NotifyOpenForm source="website_directory_empty" />
          </>}
          {hasFilters && <div className="stack" style={{ marginTop: 12 }}>
            <p className="expert-meta">Want a note when more Pandits or booking open?</p>
            <NotifyOpenForm source="website_directory_filtered" />
          </div>}
        </div> : (compact ? filtered.slice(0, 3) : filtered).map(expert => <article className="expert-row" key={expert.id}>
          <ExpertPortrait expert={expert} />
          <div>
            <h3><Link href={'/pandits/' + encodeURIComponent(expert.id)}>{expert.name}</Link></h3>
            <p>{expert.specialty}</p>
            <p className="expert-meta">{expert.languages.length ? expert.languages.join(' · ') : 'Languages not listed'}{expert.experience > 0 ? ` · ${expert.experience} ${expert.experience === 1 ? 'year' : 'years'} of practice` : ''}</p>
            <p className="expert-meta">{(() => {
              const { rating, total } = trustworthyReviewStats(expert);
              return total > 0
                ? `${rating}/5 · ${total} published ${total === 1 ? 'review' : 'reviews'}`
                : 'No published reviews yet';
            })()} · <span className={`presence${expert.isOnline ? ' is-online' : ''}`}>{presenceLabel(expert.isOnline, compact)}</span>{' · New bookings paused'}</p>
          </div>
          <p className="sr-only" id={`directory-card-${expert.id}-hint`}>Arrow keys move between View profile, Prepare a draft and free tools. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label={`Open ${expertFirstName(expert.name)} profile`} aria-describedby={`directory-card-${expert.id}-hint`}>
            <Link className="button secondary" href={'/pandits/' + encodeURIComponent(expert.id)}>View {expertFirstName(expert.name)}&apos;s profile</Link>
            <Link className="text-link" href={'/guidance/start?expertId=' + encodeURIComponent(expert.id)}>Prepare a draft →</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
          </LinkKeyboardGroup>
        </article>)}
      </>}
    </div>
    {compact && filtered.length > 0 && (
      <>
        <p className="sr-only" id="directory-preview-hint">Arrow keys move between Pandit preview next steps. Escape blurs the focused link. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" style={{ marginTop: 16 }} aria-label="Home Pandit preview next steps" aria-describedby="directory-preview-hint">
          <Link className="button secondary" href="/pandits">
            {filtered.length > 3 ? `Explore all ${filtered.length} Pandits` : 'Explore all Pandits'} →
          </Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/how-it-works#booking-availability-how">Get booking updates →</Link>
        </LinkKeyboardGroup>
      </>
    )}
  </div>;
}
