import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { getErrorMessage } from '../lib/api';
import { getArticleStats, type ArticleStats } from '../lib/panditArticlesApi';
import styles from './ArticlePerformance.module.css';

export function ArticlePerformance() {
  const [stats, setStats] = useState<ArticleStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    try {
      return Number(window.localStorage.getItem('pt-weekly-publish-goal') || '2');
    } catch {
      return 2;
    }
  });

  useEffect(() => {
    void getArticleStats()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('pt-weekly-publish-goal', String(weeklyGoal));
    } catch {
      // ignore
    }
  }, [weeklyGoal]);

  const maxViews = Math.max(1, ...(stats?.series.map((p) => p.views) ?? [1]));
  const recentViews = stats
    ? stats.series.slice(-7).reduce((sum, p) => sum + p.views, 0)
    : 0;
  const priorViews = stats
    ? stats.series.slice(-14, -7).reduce((sum, p) => sum + p.views, 0)
    : 0;
  const trendDelta = recentViews - priorViews;
  const insight =
    !stats
      ? null
      : stats.totals.views === 0
        ? 'No traffic yet this month. Publish a clear, helpful article to start measuring.'
        : trendDelta > 0
          ? `Views are up ${trendDelta} vs the prior 7 days. Keep publishing while interest is rising.`
          : trendDelta < 0
            ? `Views are down ${Math.abs(trendDelta)} vs the prior 7 days. Refresh a top article or publish something new.`
            : 'Views are steady week over week. Consistency still compounds.';

  return (
    <AppShell>
      <main className={styles.main}>
        <h1 className={styles.title}>Performance</h1>
        <p className={styles.subtitle}>Last 30 days across the app and website.</p>
        {error ? <p className={styles.error}>{error}</p> : null}
        {!stats ? (
          <div className={styles.skeletonStack} aria-hidden>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </div>
        ) : (
          <>
            {insight ? <p className={styles.insight}>{insight}</p> : null}
            <div className={styles.goalRow}>
              <label>
                Weekly publish goal
                <select
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                >
                  {[1, 2, 3, 5, 7].map((n) => (
                    <option key={n} value={n}>
                      {n} article{n === 1 ? '' : 's'} / week
                    </option>
                  ))}
                </select>
              </label>
              <p className={styles.muted}>
                Aim for steady publishing — small goals beat sporadic bursts.
              </p>
            </div>
            <div className={styles.kpis}>
              <Kpi label="Views" value={stats.totals.views} />
              <Kpi label="Reads" value={stats.totals.reads} hint="30+ seconds on page" />
              <Kpi label="Consult taps" value={stats.totals.ctaClicks} />
              <Kpi
                label="App / Web"
                value={`${stats.bySource.app} / ${stats.bySource.web}`}
              />
            </div>

            <section className={styles.card}>
              <h2>Views by day</h2>
              {stats.series.every((point) => point.views === 0) ? (
                <div className={styles.emptyState}>
                  No traffic yet. Publish an article to start measuring.
                </div>
              ) : (
                <div className={styles.bars}>
                  {stats.series.map((point) => (
                    <div key={point.date} className={styles.barRow}>
                      <span className={styles.barLabel}>{point.date.slice(5)}</span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{ width: `${(point.views / maxViews) * 100}%` }}
                        />
                      </div>
                      <span className={styles.barValue}>{point.views}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.card}>
              <h2>Top articles</h2>
              {stats.topArticles.length === 0 ? (
                <div className={styles.emptyState}>No views recorded yet.</div>
              ) : (
                <ol className={styles.topList}>
                  {stats.topArticles.map((row) => (
                    <li key={row.id}>
                      <Link to={`/articles/${row.id}`}>{row.title}</Link>
                      <strong>{row.views} views</strong>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
      {hint ? <div className={styles.kpiHint}>{hint}</div> : null}
    </div>
  );
}
