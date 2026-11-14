import { supportEmail } from '@/content/siteIdentity';
import { helpArticles, relatedHelpFor } from '@/content/help';
import Link from 'next/link';
import type { Metadata } from 'next';
import { InformationPage } from '../../about/InformationPage';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';
import { SoftResourceNotFound } from '@/components/site/SoftResourceNotFound';

export function generateStaticParams() {
  return Object.keys(helpArticles).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const article = helpArticles[slug];
    if (!article) {
    return {
      title: 'Help article not found',
      description: 'That help topic is not available. Browse the Pandit Talk help centre for account, payment and booking guidance.',
      robots: { index: false, follow: true },
    };
  }
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/help/${slug}` },
    openGraph: { title: `${article.title} · Help centre`, description: article.summary, url: `/help/${slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const article = helpArticles[slug];
  if (!article) {
    return (
      <SoftResourceNotFound
        eyebrow="Help centre"
        title="This help topic is not here."
        description="The link may be old, or the topic was renamed. Opening a missing help page does not create a booking or charge. Try the help centre, account access, free tools or a private draft."
        primaryHref="/help"
        primaryLabel="Browse help centre"
        links={[
          { href: '/help/account-access', label: 'Account access' },
          { href: '/tools', label: 'Try free tools' },
          { href: '/guidance/start', label: 'Prepare a draft' },
          { href: '/contact', label: 'Contact support' },
        ]}
        notifySource="website_help_missing"
      />
    );
  }

  const related = relatedHelpFor(slug);

  return (
    <InformationPage eyebrow="Help centre" title={article.title} intro={article.summary}>
      <aside className="notice" role="status">
        <p>
          <strong>New No Timer bookings stay paused.</strong> This article still helps with drafts, tools, account access and existing bookings.
        </p>
        <p className="sr-only" id="help-article-pause-hint">Arrow keys move between booking updates, draft and free tools. Escape blurs. NotifyOpenForm still requires source.</p>
        <LinkKeyboardGroup className="actions" style={{ marginTop: 8 }} aria-label="Help article booking pause next steps" as="p" aria-describedby="help-article-pause-hint">
          <Link href="/how-it-works#booking-availability-how">Get a note when booking opens</Link>
          {' · '}
          <Link href="/guidance/start">Prepare a private draft</Link>
          {' · '}
          <Link href="/tools">Try free tools</Link>
        </LinkKeyboardGroup>
        <div className="notify-inline" style={{ marginTop: 12 }}>
          <NotifyOpenForm source={`website_help_${slug}`} helpText="Booking-open emails only — separate from this help topic. See our" />
        </div>
      </aside>
      <article className="panel info-card">
        <h2>What to do</h2>
        <ol>
          {article.steps.map(step => <li key={step}>{step}</li>)}
        </ol>
        <p className="expert-meta">{article.tip}</p>
        <p className="sr-only" id="help-article-next-hint">Arrow keys move between article next-step links. Escape blurs the focused control. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Help article next steps" aria-describedby="help-article-next-hint">
          {slug === 'first-consultation' && <>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/pandits">Explore Pandits →</Link>
            <Link className="text-link" href="/how-it-works#booking-availability-how">Booking updates →</Link>
          </>}
          {slug === 'preparing-a-draft' && <>
            <Link className="button" href="/guidance/start">Start a draft</Link>
            <Link className="text-link" href="/guidance">Browse guidance topics →</Link>
          </>}
          {slug === 'tools-and-readings' && <>
            <Link className="button" href="/tools">Open free tools</Link>
            <Link className="text-link" href="/login?returnTo=%2Freports&reason=auth">Sign in for saved reports →</Link>
          </>}
          {slug === 'coins-and-payment-pending' && <>
            <Link className="button secondary" href="/login?returnTo=%2Fwallet&reason=auth">Sign in to open wallet</Link>
            <Link className="text-link" href="/login?returnTo=%2Fwallet%2Fpayment-status&reason=auth">Sign in for payment status →</Link>
            <Link className="text-link" href="/wallet/recharge">Why recharge is paused →</Link>
          </>}
          {slug === 'booking-cancellation' && <Link className="text-link" href="/login?returnTo=%2Fbookings&reason=auth">Sign in to view bookings →</Link>}
          {slug === 'joining-audio-video' && <Link className="text-link" href="/login?returnTo=%2Fbookings&reason=auth">Sign in to open bookings →</Link>}
          {slug === 'chat-reconnect' && <Link className="text-link" href="/login?returnTo=%2Fbookings&reason=auth">Sign in to open bookings →</Link>}
          {slug === 'account-access' && <>
            <Link className="button" href="/login?reason=auth">Sign in</Link>
            <Link className="text-link" href="/delete-account">Delete account help →</Link>
          </>}
          {slug === 'refunds-and-complaints' && <>
            <Link className="button secondary" href="/contact">Contact support</Link>
            <Link className="text-link" href="/grievance-redressal">Grievance redressal →</Link>
          </>}
        </LinkKeyboardGroup>
      </article>
      <section className="panel info-card">
        <h2>Related help</h2>
        <p className="sr-only" id="help-related-hint">Arrow keys move between related topics. Escape blurs the focused link.</p>
        <LinkKeyboardGroup as="nav" aria-label="Related help topics" aria-describedby="help-related-hint">
          <ul className="link-list">
            {related.map(key => (
              <li key={key}><Link href={`/help/${key}`}>{helpArticles[key].title}</Link></li>
            ))}
            <li><Link href="/help">All help topics</Link></li>
            <li><Link href="/contact">Contact support</Link></li>
          </ul>
        </LinkKeyboardGroup>
      </section>
      <section className="panel info-card">
        <h2>Need someone to take a look?</h2>
        <p>Contact support with a short description and the relevant booking or payment reference. Leave private birth details and conversation text out of your first email.</p>
        <p className="sr-only" id="help-article-email-hint">Arrow keys move between email, contact, grievance and all help. Escape blurs the focused control.</p>
        <LinkKeyboardGroup className="actions" aria-label="Help article email support" aria-describedby="help-article-email-hint">
          <a
            className="button"
            href={`mailto:${supportEmail}?subject=${encodeURIComponent(`Help: ${article.title}`)}&body=${encodeURIComponent(`Help article: /help/${slug}\n\nBooking or payment reference (if any):\n\nWhat happened:\n`)}`}
          >
            Email support about this topic <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens your email app)</span>
          </a>
          <Link className="button secondary" href="/contact">Contact page</Link>
          <Link className="text-link" href="/grievance-redressal">Grievance redressal →</Link>
          <Link className="text-link" href="/help">All help topics →</Link>
        </LinkKeyboardGroup>
      </section>
      <Link className="info-back" href="/help"><span aria-hidden="true">←</span> Back to all help topics</Link>
    </InformationPage>
  );
}
