import type { ReactNode } from 'react';

export function InformationPage({ eyebrow, title, intro, children, focusTitle = false }: {
  eyebrow: ReactNode;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  /** When true, the title can receive programmatic focus (e.g. after account deletion). */
  focusTitle?: boolean;
}) {
  return (
    <main id="main-content" className="page info-page">
      <header className="info-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="info-page-title" className="info-hero__title" tabIndex={focusTitle ? -1 : undefined}>{title}</h1>
        {intro ? (typeof intro === 'string' ? <p className="lede">{intro}</p> : <div className="lede">{intro}</div>) : null}
      </header>
      <div className="info-content" aria-labelledby="info-page-title">{children}</div>
    </main>
  );
}
