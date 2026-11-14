import { Noto_Sans_Devanagari } from 'next/font/google';
import type { ReactNode } from 'react';
import { ArticleChrome } from '@/components/articles/ArticleChrome';

const hindi = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-hi',
  display: 'swap',
});

export default function JournalLayout({ children }: { children: ReactNode }) {
  return (
    <div className={hindi.variable} style={{ fontFamily: 'var(--font-body), var(--font-hi), system-ui, sans-serif' }}>
      <ArticleChrome>{children}</ArticleChrome>
    </div>
  );
}
