'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiteIcon, type SiteIconName } from '@/components/site/SiteIcon';
import styles from './customer.module.css';

const links = [
  ['/home', 'Consult', 'home'],
  ['/pandits', 'Experts', 'users'],
  ['/guidance', 'Guidance', 'compass'],
  ['/tools', 'Tools', 'grid'],
  ['/account/profile', 'Profile', 'user'],
] as const;

export default function CustomerNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.customerMobileNav} aria-label="Primary navigation">
      {links.map(([href, label, icon]) => {
        const active = href === '/account/profile'
          ? pathname.startsWith('/account')
            || pathname === '/profile-setup'
            || ['/bookings', '/wallet', '/reports', '/notifications', '/sessions'].some((route) => pathname === route || pathname.startsWith(`${route}/`))
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link href={href} key={href} aria-current={active ? 'page' : undefined}>
            <SiteIcon name={icon as SiteIconName} size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
