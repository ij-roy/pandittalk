import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { getErrorMessage } from '../lib/api';
import {
  ARTICLE_CATEGORIES,
  createMyArticle,
  deleteMyArticle,
  listMyArticles,
  unpublishMyArticle,
  type ArticleStatus,
  type PanditArticle,
} from '../lib/panditArticlesApi';
import { articlePublicUrl } from '../lib/site';
import styles from './ArticlesHome.module.css';

const STATUS_FILTERS: { id: ArticleStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' },
  { id: 'unpublished', label: 'Unpublished' },
];

type SortKey = 'updated' | 'title' | 'status';

function statusLabel(status: ArticleStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function ArticlesHome() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<PanditArticle[]>([]);
  const [allArticles, setAllArticles] = useState<PanditArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ArticleStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    void listMyArticles({})
      .then((res) => {
        if (!cancelled) setAllArticles(res.articles);
      })
      .catch(() => {
        // Counts are optional.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listMyArticles({
      status: status === 'all' ? undefined : status,
      search: debouncedSearch || undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setArticles(res.articles);
          setSelected(new Set());
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, debouncedSearch]);

  const counts = useMemo(() => {
    const base: Record<ArticleStatus | 'all', number> = {
      all: allArticles.length,
      draft: 0,
      scheduled: 0,
      published: 0,
      unpublished: 0,
    };
    for (const article of allArticles) {
      base[article.status] += 1;
    }
    return base;
  }, [allArticles]);

  const sorted = useMemo(() => {
    const list = [...articles];
    list.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (sort === 'status') return a.status.localeCompare(b.status);
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
    return list;
  }, [articles, sort]);

  const selectedArticles = useMemo(
    () => sorted.filter((a) => selected.has(a.id)),
    [sorted, selected],
  );

  const canUnpublish = selectedArticles.some((a) => a.status === 'published');
  const canDelete = selectedArticles.some(
    (a) => a.status === 'draft' || a.status === 'unpublished',
  );

  async function handleNew() {
    setCreating(true);
    setError(null);
    try {
      const created = await createMyArticle({
        title: 'Untitled article',
        content: '',
        category: 'spirituality',
      });
      navigate(`/articles/${created.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setCreating(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === sorted.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(sorted.map((a) => a.id)));
  }

  async function refreshLists() {
    const [filtered, all] = await Promise.all([
      listMyArticles({
        status: status === 'all' ? undefined : status,
        search: debouncedSearch || undefined,
      }),
      listMyArticles({}),
    ]);
    setArticles(filtered.articles);
    setAllArticles(all.articles);
    setSelected(new Set());
  }

  async function handleBulkUnpublish() {
    const targets = selectedArticles.filter((a) => a.status === 'published');
    if (targets.length === 0) return;
    const ok = window.confirm(
      `Unpublish ${targets.length} article${targets.length === 1 ? '' : 's'}?`,
    );
    if (!ok) return;
    setBulkBusy(true);
    setError(null);
    try {
      for (const article of targets) {
        await unpublishMyArticle(article.id);
      }
      await refreshLists();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkDelete() {
    const targets = selectedArticles.filter(
      (a) => a.status === 'draft' || a.status === 'unpublished',
    );
    if (targets.length === 0) return;
    const ok = window.confirm(
      `Permanently delete ${targets.length} draft/unpublished article${
        targets.length === 1 ? '' : 's'
      }? This cannot be undone.`,
    );
    if (!ok) return;
    setBulkBusy(true);
    setError(null);
    try {
      for (const article of targets) {
        await deleteMyArticle(article.id);
      }
      await refreshLists();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <AppShell>
      <main className={styles.main}>
        <div className={styles.hero}>
          <div>
            <h1 className={styles.title}>Articles</h1>
            <p className={styles.subtitle}>
              Write once. Publish to the app and pandittalk.com.
            </p>
          </div>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => void handleNew()}
            disabled={creating}
          >
            {creating ? 'Creating…' : 'New article'}
          </button>
        </div>

        <Link to="/articles/performance" className={styles.insightsTeaser}>
          <span>See how your writing performs</span>
          <span className={styles.insightsArrow}>View insights →</span>
        </Link>

        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={
                  status === filter.id
                    ? `${styles.chip} ${styles.chipActive}`
                    : styles.chip
                }
                onClick={() => setStatus(filter.id)}
              >
                {filter.label}
                <span className={styles.chipCount}>{counts[filter.id]}</span>
              </button>
            ))}
          </div>
          <div className={styles.toolbarRight}>
            <label className={styles.sortLabel}>
              Sort
              <select
                className={styles.sort}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="updated">Updated</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
            </label>
            <input
              className={styles.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your articles"
              aria-label="Search articles"
            />
          </div>
        </div>

        {!loading && sorted.length > 0 ? (
          <div className={styles.bulkBar}>
            <label className={styles.bulkSelectAll}>
              <input
                type="checkbox"
                checked={selected.size > 0 && selected.size === sorted.length}
                onChange={toggleSelectAll}
              />
              {selected.size === 0
                ? 'Select'
                : `${selected.size} selected`}
            </label>
            <div className={styles.bulkActions}>
              <button
                type="button"
                className={styles.bulkBtn}
                disabled={!canUnpublish || bulkBusy}
                onClick={() => void handleBulkUnpublish()}
              >
                Unpublish
              </button>
              <button
                type="button"
                className={styles.bulkDanger}
                disabled={!canDelete || bulkBusy}
                onClick={() => void handleBulkDelete()}
              >
                Delete drafts
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
        {loading ? <p className={styles.muted}>Loading articles…</p> : null}

        {!loading && articles.length === 0 ? (
          <div className={styles.empty}>
            <h2>No articles yet</h2>
            <ol className={styles.emptySteps}>
              <li>Start a draft with a clear title</li>
              <li>Preview as phone or website</li>
              <li>Publish when it feels ready</li>
            </ol>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => void handleNew()}
              disabled={creating}
            >
              Write your first article
            </button>
          </div>
        ) : null}

        <div className={styles.list}>
          {sorted.map((article) => (
            <div key={article.id} className={styles.cardRow}>
              <label className={styles.cardCheck}>
                <input
                  type="checkbox"
                  checked={selected.has(article.id)}
                  onChange={() => toggleSelect(article.id)}
                  aria-label={`Select ${article.title}`}
                />
              </label>
              <button
                type="button"
                className={styles.card}
                onClick={() => navigate(`/articles/${article.id}`)}
              >
                <img
                  src={article.coverImageUrl}
                  alt=""
                  className={styles.cover}
                />
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.status} ${styles[article.status]}`}>
                      {statusLabel(article.status)}
                    </span>
                    <span>
                      {ARTICLE_CATEGORIES.find((c) => c.id === article.category)?.label}
                    </span>
                    <span>
                      Updated{' '}
                      {new Date(article.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <h2 className={styles.cardTitle}>{article.title}</h2>
                  <p className={styles.excerpt}>{article.excerpt || 'No excerpt yet'}</p>
                  <p className={styles.footer}>
                    {article.status === 'published'
                      ? articlePublicUrl(article.slug)
                      : 'Draft stays private until you publish'}
                  </p>
                </div>
              </button>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
