import type { SVGProps } from 'react';

const paths = {
  arrow: 'M7 17 17 7M7 7h10v10',
  right: 'M4 12h16m-6-6 6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  career: 'M9 6V3h6v3M3 6h18v14H3ZM3 11a20 20 0 0 0 18 0M10 12h4',
  family: 'M3 21v-3a5 5 0 0 1 10 0v3M11 21v-3a5 5 0 0 1 10 0v3M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  rings: 'M14 13a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM22 13a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM5 3l3 3 3-3M13 3l3 3 3-3',
  book: 'M12 5v16M3 3h4a5 5 0 0 1 5 2 5 5 0 0 1 5-2h4v16h-4a5 5 0 0 0-5 2 5 5 0 0 0-5-2H3Z',
  health: 'M3 12h4l3-8 4 16 3-8h4',
  business: 'M4 21V7h10v14M14 12h6v9M2 21h20M8 11h2M8 15h2M8 19h2',
  coins: 'M9 9a7 7 0 1 1 0 14 7 7 0 0 1 0-14ZM9 13v6M9 1a7 7 0 0 1 12 7 7 7 0 0 1-4 6M15 4v4',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4M18 4h4',
  lock: 'M6 10V7a6 6 0 0 1 12 0v3M4 10h16v12H4ZM12 15v3',
  note: 'M4 3h16v18H4ZM8 8h8M8 12h8M8 16h4',
  chat: 'M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4ZM8 10h8M8 14h5',
  info: 'M12 8h.01M12 11v6M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  bell: 'M10 21h4M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9',
} as const;

export type SiteIconName = keyof typeof paths;
export function SiteIcon({ name, size = 20, ...props }: SVGProps<SVGSVGElement> & { name: SiteIconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><path d={paths[name]} /></svg>;
}
