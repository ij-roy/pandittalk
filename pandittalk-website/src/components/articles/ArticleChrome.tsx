import type { ReactNode } from 'react';

import './articles.css';

/** Shared journal chrome: loads journal styles and a consistent reading shell. */
export function ArticleChrome({ children }: { children: ReactNode }) {
  return (
    <div className="journal" role="region" aria-label="Pandit Talk journal">
      {children}
    </div>
  );
}
