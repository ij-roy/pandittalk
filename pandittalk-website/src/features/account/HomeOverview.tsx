'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SiteIcon, type SiteIconName } from '@/components/site/SiteIcon';
import { canResume, parseBooking } from '@/features/bookings/types';
import type { Booking } from '@/features/bookings/types';
import { trustworthyReviewStats, type Expert } from '@/features/experts/types';
import { useApi } from '@/lib/api/client';
import { CATEGORY_LABELS, type ArticleListItem } from '@/lib/articles/api';
import { formatIstDateTime } from '@/lib/time/ist';

type Wallet = { coinBalance: number };
type Unread = { count: number };
type Profile = Record<string, string | null | undefined>;

const guidanceAreas: Array<{
  title: string;
  icon: SiteIconName;
  href: string;
  tone: 'gold' | 'rose' | 'sage';
}> = [
  { title: 'Career & Business', icon: 'business', href: '/pandits?area=career_business', tone: 'gold' },
  { title: 'Love & Relationships', icon: 'heart', href: '/pandits?area=love_relationships', tone: 'rose' },
  { title: 'Finance & Wealth', icon: 'coins', href: '/pandits?area=finance_wealth', tone: 'gold' },
  { title: 'Marriage & Family', icon: 'family', href: '/pandits?area=marriage_family', tone: 'rose' },
  { title: 'Health & Wellbeing', icon: 'health', href: '/pandits?area=health_wellbeing', tone: 'sage' },
  { title: 'Spiritual Protection', icon: 'spark', href: '/pandits?area=spiritual_protection', tone: 'sage' },
];

const selfServiceTools: Array<{ title: string; icon: SiteIconName; href: string }> = [
  { title: 'Basic Kundli', icon: 'note', href: '/tools/kundli' },
  { title: 'Daily Horoscope', icon: 'spark', href: '/tools/horoscope' },
  { title: 'Compatibility Check', icon: 'rings', href: '/tools/compatibility' },
  { title: 'Palmistry', icon: 'user', href: '/tools/palm-reading' },
];

const profileSteps = [
  ['phoneNumber', 'Mobile verified'],
  ['firstName', 'Name'],
  ['dob', 'Birth date'],
  ['timeOfBirth', 'Birth time'],
  ['placeOfBirth', 'Birth place'],
] as const;

function SectionHeading({ title, href, label = 'View all', id }: { title: string; href?: string; label?: string; id?: string }) {
  return (
    <div className="homeSectionHeading">
      <h2 id={id}>{title}</h2>
      {href ? <Link className="homeSectionLink" href={href}>{label}<span aria-hidden="true">→</span></Link> : null}
    </div>
  );
}

function SummaryCard({ label, value, description, href }: { label: string; value: string; description: string; href: string }) {
  return (
    <Link className="homeAccountCard" href={href}>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
      <span className="homeAccountCardLink">Open {label.toLowerCase()} <span aria-hidden="true">→</span></span>
    </Link>
  );
}

function getFeaturedExpert(experts: Expert[]) {
  return experts
    .slice()
    .sort((a, b) => Number(b.isOnline) - Number(a.isOnline) || trustworthyReviewStats(b).rating - trustworthyReviewStats(a).rating || b.experience - a.experience || a.name.localeCompare(b.name))[0] ?? null;
}

function FeaturedPandit({ expert }: { expert: Expert }) {
  const stats = trustworthyReviewStats(expert);
  const reviewLine = stats.total > 0 ? `${stats.rating.toFixed(1)} ★ · ${stats.total} review${stats.total === 1 ? '' : 's'}` : 'New on PanditTalk';
  return (
    <div className="homePanditWrap">
      <p className="homeCardEyebrow">{expert.isOnline ? 'Available now' : 'Available to book'}</p>
      <Link className="homePanditCard" href={`/pandits/${encodeURIComponent(expert.id)}`}>
        <span className="homePanditAvatar">
          {expert.image_url ? <img src={expert.image_url} alt="" width={64} height={64} loading="lazy" decoding="async" /> : expert.name.trim().slice(0, 1).toUpperCase()}
        </span>
        <span className="homePanditCopy">
          <strong>{expert.name}</strong>
          <small>{expert.languages.length ? expert.languages.join(' · ') : 'Hindi and English'}</small>
          <small>{reviewLine}</small>
          <small>{expert.isOnline ? 'Chat Now may be available' : 'View scheduled session options'}</small>
        </span>
        <SiteIcon name="right" size={20} />
      </Link>
    </div>
  );
}

function ProfileProgress({ profile }: { profile?: Profile }) {
  if (!profile) return null;
  const completed = profileSteps.filter(([field]) => Boolean(profile[field]?.trim())).length;
  const percentage = Math.round((completed / profileSteps.length) * 100);
  const next = profileSteps.find(([field]) => !profile[field]?.trim());
  return (
    <section className="homeProfileCard" aria-labelledby="home-profile-heading">
      <div className="homeProfileTopline">
        <span className="eyebrow">Your profile</span>
        <strong>{percentage}%</strong>
      </div>
      <div className="homeProgressTrack" aria-label={`${percentage}% of profile complete`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><span style={{ width: `${percentage}%` }} /></div>
      <h2 id="home-profile-heading">{percentage === 100 ? 'Ready for a more personal conversation.' : 'Add a little context when you are ready.'}</h2>
      <p>{next ? `Next, add your ${next[1].toLowerCase()} so a future conversation can start with useful context.` : 'Your saved details can help a Pandit understand what matters to you.'}</p>
      <div className="homeProfileChips">
        {profileSteps.slice(0, 3).map(([field, label]) => <span key={field} className={profile[field]?.trim() ? 'is-complete' : ''}>{profile[field]?.trim() ? '✓ ' : ''}{label}</span>)}
      </div>
      <Link className="homeInlineLink" href="/account">Continue profile <span aria-hidden="true">→</span></Link>
    </section>
  );
}

function ReadingTile({ article }: { article: ArticleListItem }) {
  return (
    <Link className="homeReadingTile" href={`/articles/${article.slug}`} aria-label={`Read ${article.title}`}>
      {article.coverImageUrl ? <img src={article.coverImageUrl} alt="" loading="lazy" decoding="async" /> : <span className="homeReadingPlaceholder" aria-hidden="true">PanditTalk Journal</span>}
      <strong>{article.title}</strong>
    </Link>
  );
}

function ArticleMetadata({ article }: { article: ArticleListItem }) {
  const [showCategory, setShowCategory] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setShowCategory(current => !current), 7000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className="homeArticleMetadata" aria-hidden="true">
      <span className={!showCategory ? 'is-visible' : ''}>{article.readTimeMinutes} min read</span>
      <span className={showCategory ? 'is-visible' : ''}>{CATEGORY_LABELS[article.category]}</span>
    </span>
  );
}

function ArticlePost({ article }: { article: ArticleListItem }) {
  const normalizedAuthor = article.author.trim();
  const isTeam = !normalizedAuthor || /^pandittalk( team)?$/i.test(normalizedAuthor);
  const author = isTeam ? 'PanditTalk Team' : normalizedAuthor;
  const subtitle = isTeam ? 'Curated guidance for everyday questions' : 'Guidance from the PanditTalk community';
  return (
    <Link className="homeArticlePost" href={`/articles/${article.slug}`} aria-label={`Read ${article.title}`}>
      <span className="homeArticleAuthor">
        <img src="/logo.png" alt="" width={38} height={38} loading="lazy" />
        <span><strong>{author}</strong><small>{subtitle}</small></span>
        <SiteIcon name="spark" size={17} />
      </span>
      <span className="homeArticleCover">
        {article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.coverAlt || ''} loading="lazy" decoding="async" /> : <span className="homeReadingPlaceholder" aria-hidden="true">PanditTalk Journal</span>}
        <ArticleMetadata article={article} />
      </span>
      <span className="homeArticleBody">
        <strong>{article.title}</strong>
        {article.excerpt ? <small>{article.excerpt}</small> : null}
      </span>
    </Link>
  );
}

export function HomeOverview({ initialArticles }: { initialArticles: ArticleListItem[] }) {
  const bookings = useApi<unknown[]>('/bookings');
  const wallet = useApi<Wallet>('/wallet');
  const unread = useApi<Unread>('/notifications/unread-count');
  const reports = useApi<unknown[]>('/reports');
  const profile = useApi<Profile>('/users/profile');
  const experts = useApi<Expert[]>('/experts');

  const parsedBookings: Booking[] = Array.isArray(bookings.data) ? bookings.data.flatMap(row => {
    try { return [parseBooking(row)]; } catch { return []; }
  }) : [];
  const nextBooking = parsedBookings
    .filter(booking => canResume(booking) && Date.parse(booking.startTime) + booking.durationMinutes * 60000 > Date.now())
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))[0];
  const featuredExpert = useMemo(() => getFeaturedExpert(Array.isArray(experts.data) ? experts.data : []), [experts.data]);
  const featuredArticles = initialArticles.slice(0, 4);
  const latestArticles = initialArticles.slice(4);
  const balance = wallet.data && Number.isFinite(wallet.data.coinBalance) ? `${wallet.data.coinBalance.toLocaleString('en-IN')} coins` : '—';
  const unreadCount = unread.data && Number.isInteger(unread.data.count) ? `${unread.data.count} unread` : '—';
  const reportCount = Array.isArray(reports.data) ? `${reports.data.length} saved` : '—';
  const accountLoading = bookings.loading || wallet.loading || unread.loading || reports.loading;
  const accountError = bookings.error || wallet.error || unread.error || reports.error;

  function retryAccount() {
    bookings.reload(); wallet.reload(); unread.reload(); reports.reload(); profile.reload(); experts.reload();
  }

  return (
    <section className="homeOverview" aria-label="Your PanditTalk home" aria-busy={accountLoading || undefined}>
      <section className="homeConsultHero" aria-labelledby="home-consult-heading">
        <div className="homeConsultCopy">
          <p className="homeHeroEyebrow">Live pandit consultations</p>
          <h2 id="home-consult-heading">Talk to a verified pandit</h2>
          <p>Start a live chat or book an audio or video consultation with an expert you trust.</p>
          <Link className="homeHeroButton" href="/pandits">Browse pandits <span aria-hidden="true">→</span></Link>
        </div>
        <img className="homeHeroMark" src="/logo.png" alt="" width={220} height={220} />
      </section>

      <div className="homePrimaryActions">
        <Link className="homeChatAction" href="/pandits"><SiteIcon name="chat" size={22} /><span><strong>Chat Now</strong><small>Connect with an online pandit</small></span><SiteIcon name="right" size={20} /></Link>
        <Link className="homeBookAction" href="/pandits"><SiteIcon name="note" size={21} /><strong>Book chat, audio or video</strong></Link>
      </div>

      {featuredExpert ? <FeaturedPandit expert={featuredExpert} /> : null}
      <ProfileProgress profile={profile.data} />

      <section className="homeTopicSection" aria-labelledby="home-topics-heading">
        <SectionHeading title="What would you like to discuss?" id="home-topics-heading" />
        <p className="homeSectionDescription">Choose a topic to see Pandits who can help you think through it.</p>
        <div className="homeTopicGrid">
          {guidanceAreas.map(area => <Link className={`homeTopicTile homeTopicTile--${area.tone}`} key={area.title} href={area.href}><SiteIcon name={area.icon} size={28} /><strong>{area.title}</strong><SiteIcon name="right" size={17} /></Link>)}
        </div>
      </section>

      <section className="homeReadingSection" aria-labelledby="home-reading-heading">
        <SectionHeading title="Helpful reading" href="/articles" id="home-reading-heading" />
        {featuredArticles.length ? <div className="homeReadingRail">{featuredArticles.map(article => <ReadingTile key={article.id} article={article} />)}</div> : <p className="homeEmptyNote">New guidance will appear here soon.</p>}
      </section>

      <section className="homeToolsSection" aria-labelledby="home-tools-heading">
        <SectionHeading title="Self-service tools" id="home-tools-heading" />
        <p className="homeSectionDescription">Explore these on your own, or talk through your questions with a pandit in a live session.</p>
        <div className="homeToolsGrid">{selfServiceTools.map(tool => <Link className="homeToolTile" key={tool.title} href={tool.href}><span><SiteIcon name={tool.icon} size={29} /></span><strong>{tool.title}</strong></Link>)}</div>
      </section>

      {latestArticles.length ? <section className="homeLatest" aria-labelledby="home-latest-heading"><SectionHeading title="Latest" id="home-latest-heading" /><div className="homeArticleFeed">{latestArticles.map(article => <ArticlePost key={article.id} article={article} />)}</div></section> : null}

      {nextBooking ? <section className="homeUpcoming" aria-labelledby="home-upcoming-heading"><div><p className="eyebrow">Your next conversation</p><h2 id="home-upcoming-heading">{nextBooking.panditName || nextBooking.pandit?.name || 'Your Pandit'}</h2><p>{formatIstDateTime(nextBooking.startTime)} · {nextBooking.format} · {nextBooking.durationMinutes} minutes</p></div><Link className="button secondary" href={`/bookings/${encodeURIComponent(nextBooking.id)}`}>Open booking <span aria-hidden="true">→</span></Link></section> : null}

      <section className="homeAccountSection" aria-labelledby="home-account-heading">
        <SectionHeading title="Your account" id="home-account-heading" />
        <div className="homeAccountGrid">
          <SummaryCard label="Wallet" value={balance} description="Available for a confirmed booking." href="/wallet" />
          <SummaryCard label="Updates" value={unreadCount} description="Booking and session notices." href="/notifications" />
          <SummaryCard label="Reports" value={reportCount} description="Paid readings you have kept." href="/reports" />
        </div>
        {accountError ? <p className="homePartialStatus" role="status">Some account details are unavailable. <button className="homeInlineButton" type="button" onClick={retryAccount}>Retry overview</button></p> : null}
      </section>
    </section>
  );
}
