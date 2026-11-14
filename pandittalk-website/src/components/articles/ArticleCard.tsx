import Link from 'next/link';
import { CATEGORY_LABELS, type ArticleListItem } from '@/lib/articles/api';
import { formatDate, formatReadTime } from '@/lib/articles/format';

export function ArticleCard({
  article,
  featured = false,
}: {
  article: ArticleListItem;
  featured?: boolean;
}) {
  const href = `/articles/${article.slug}`;
  const meta = `${CATEGORY_LABELS[article.category]} · ${formatReadTime(article.readTimeMinutes)} · ${formatDate(article.publishedAt)}`;

  return (
    <Link
      href={href}
      className={`article-card${featured ? ' article-card--featured' : ''}`}
      aria-label={`${article.title}. ${meta}`}
    >
      {article.coverImageUrl ? <img
        src={article.coverImageUrl}
        alt=""
        className="article-card__image"
        loading="lazy"
        decoding="async"
      /> : <div className="article-card__placeholder" aria-hidden="true">Pandit Talk Journal</div>}
      <div className="article-card__body">
        <p className="article-card__meta">
          {meta}
        </p>
        <h2>
          {article.title}
        </h2>
        <p className="article-card__excerpt">{article.excerpt}</p>
        <span className="article-card__link">Read article →</span>
      </div>
    </Link>
  );
}
