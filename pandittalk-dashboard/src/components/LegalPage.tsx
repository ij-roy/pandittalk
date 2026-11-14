import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './LegalPage.module.css';

type LegalPageProps = {
  title: string;
  effectiveDate?: string;
  lastUpdated?: string;
  children: ReactNode;
};

export function LegalPage({
  title,
  effectiveDate,
  lastUpdated,
  children,
}: LegalPageProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} — PanditTalk`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <header className={styles.header}>
          <p className={styles.brand}>PanditTalk</p>
          <p className={styles.navRow}>
            <Link to="/login" className={styles.backLink}>
              ← Back to sign in
            </Link>
          </p>
          <h1 className={styles.title}>{title}</h1>
          {(effectiveDate || lastUpdated) && (
            <p className={styles.meta}>
              {effectiveDate && <span>Effective Date: {effectiveDate}</span>}
              {effectiveDate && lastUpdated && (
                <span className={styles.metaSep}> · </span>
              )}
              {lastUpdated && <span>Last Updated: {lastUpdated}</span>}
            </p>
          )}
        </header>

        <div className={styles.content}>{children}</div>

        <footer className={styles.footer}>
          <p>© {new Date().getFullYear()} PanditTalk. All rights reserved.</p>
          <p className={styles.navRow}>
            <Link to="/login" className={styles.backLink}>
              Back to sign in
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
