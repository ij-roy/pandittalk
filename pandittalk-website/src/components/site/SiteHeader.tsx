'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SiteIcon } from './SiteIcon';
import { availabilityCopy } from '@/content/availability';

const links = [['/pandits', 'Pandits'], ['/guidance', 'Find guidance'], ['/tools', 'Tools'], ['/articles', 'Journal'], ['/our-approach', 'Our approach']] as const;
const accountLinks = [['/home', 'My home'], ['/account', 'Account'], ['/bookings', 'Bookings'], ['/wallet', 'Wallet'], ['/notifications', 'Notifications'], ['/help', 'Help centre']] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const current = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const closeMenu = () => { if (menu.current) menu.current.open = false; setMenuOpen(false); };

  useEffect(closeMenu, [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    const content = document.getElementById('site-content');
    const footer = document.querySelector('footer.site-footer');
    if (menuOpen) {
      content?.setAttribute('inert', '');
      footer?.setAttribute('inert', '');
    } else {
      content?.removeAttribute('inert');
      footer?.removeAttribute('inert');
    }
    return () => {
      document.body.style.overflow = '';
      content?.removeAttribute('inert');
      footer?.removeAttribute('inert');
    };
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const root = menu.current;
    const panel = root?.querySelector<HTMLElement>('#mobile-navigation');
    if (!root || !panel) return;
    const focusables = () => Array.from(root.querySelectorAll<HTMLElement>('summary, #mobile-navigation a[href], #mobile-navigation button, #mobile-navigation [tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    const items = focusables();
    const firstNav = items.find(el => el.tagName !== 'SUMMARY');
    (firstNav || items[0])?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
        const links = Array.from(panel.querySelectorAll<HTMLAnchorElement>('a[href]'));
        if (links.length === 0) return;
        const index = links.indexOf(document.activeElement as HTMLAnchorElement);
        if (index < 0 && event.target !== panel && !(event.target instanceof HTMLAnchorElement)) return;
        event.preventDefault();
        let next = Math.max(0, index);
        if (event.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % links.length;
        else if (event.key === 'ArrowUp') next = index < 0 ? links.length - 1 : (index - 1 + links.length) % links.length;
        else if (event.key === 'Home') next = 0;
        else next = links.length - 1;
        links[next]?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('nav.desktop-nav');
    if (!nav) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End' && event.key !== 'Escape') return;
      const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href]'));
      if (links.length === 0) return;
      const index = links.indexOf(document.activeElement as HTMLAnchorElement);
      if (index < 0) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur();
        return;
      }
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % links.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + links.length) % links.length;
      else if (event.key === 'Home') next = 0;
      else next = links.length - 1;
      links[next]?.focus();
    };
    nav.addEventListener('keydown', onKey);
    return () => nav.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    const account = document.querySelector<HTMLElement>('.header-account');
    if (!account) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End' && event.key !== 'Escape') return;
      const links = Array.from(account.querySelectorAll<HTMLAnchorElement>('a[href]'));
      if (links.length === 0) return;
      const index = links.indexOf(document.activeElement as HTMLAnchorElement);
      if (index < 0) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur();
        return;
      }
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % links.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + links.length) % links.length;
      else if (event.key === 'Home') next = 0;
      else next = links.length - 1;
      links[next]?.focus();
    };
    account.addEventListener('keydown', onKey);
    return () => account.removeEventListener('keydown', onKey);
  }, [signedIn]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/session', { signal: controller.signal, cache: 'no-store' })
      .then(response => response.json())
      .then(data => { if (!controller.signal.aborted) setSignedIn(!!data?.signedIn); })
      .catch(() => { if (!controller.signal.aborted) setSignedIn(false); });
    return () => controller.abort();
  }, [pathname]);

  useEffect(() => {
    if (!signedIn) {
      setUnread(0);
      return;
    }
    const controller = new AbortController();
    fetch('/api/backend/notifications/unread-count', { signal: controller.signal, cache: 'no-store', credentials: 'same-origin' })
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (controller.signal.aborted) return;
        const count = data && Number.isInteger(data.count) ? data.count : 0;
        setUnread(count);
      })
      .catch(() => { if (!controller.signal.aborted) setUnread(0); });
    return () => controller.abort();
  }, [signedIn, pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menu.current?.open) {
        event.preventDefault();
        closeMenu();
        menu.current.querySelector('summary')?.focus();
      }
    };
    const onOutside = (event: Event) => {
      if (menu.current?.open && event.target instanceof Node && !menu.current.contains(event.target)) {
        closeMenu();
        // Outside dismiss should return keyboard users to the menu control.
        requestAnimationFrame(() => menu.current?.querySelector('summary')?.focus());
      }
    };
    const desktop = window.matchMedia('(min-width: 1101px)');
    const onResize = () => { if (desktop.matches) closeMenu(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);
    desktop.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
      desktop.removeEventListener('change', onResize);
    };
  }, []);

  return <header className="site-header">
    <a
      className="skip-link"
      href="#site-content"
      onClick={event => {
        const target = document.getElementById('site-content');
        if (!target) return;
        event.preventDefault();
        target.focus({ preventScroll: true });
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', '#site-content');
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLAnchorElement).blur();
      }}
    >Skip to content</a>
    <div className="header-inner">
      <Link href="/" className="brand" aria-label="Pandit Talk home"><Image src="/logo.png" alt="" width={39} height={39} sizes="39px" priority /><span aria-hidden="true">Pandit Talk</span></Link>
      <nav aria-label="Main navigation" className="desktop-nav" aria-describedby="desktop-nav-hint">
        <p id="desktop-nav-hint" className="sr-only">Arrow keys move between sections. Home and End jump to the first or last link. Escape blurs. Skip to content still targets site-content.</p>
        {links.map(([href, label]) => <Link href={href} key={href} aria-current={current(href) ? 'page' : undefined}>{label}</Link>)}
      </nav>
      <div className="header-account" aria-busy={signedIn === null ? true : undefined} aria-describedby="header-account-hint">
        <p id="header-account-hint" className="sr-only">Arrow keys move between account links. Escape blurs the focused link. Skip to content still targets site-content.</p>
        {signedIn ? <>
          <Link href="/how-it-works#booking-availability-how" title={availabilityCopy.publicStatus}>{availabilityCopy.headerLink}</Link>
          <Link href="/notifications" aria-label={unread > 0 ? `Updates, ${unread} unread` : 'Updates'}>
            <SiteIcon name="bell" size={17} />
            {unread > 0 ? `Updates (${unread})` : 'Updates'}
          </Link>
          <Link href="/account"><SiteIcon name="user" size={17} />Account</Link>
          <Link className="button" href="/home">My home<SiteIcon name="right" size={16} /></Link>
        </> : <>
          <Link href="/how-it-works#booking-availability-how" title={availabilityCopy.publicStatus}>{availabilityCopy.headerLink}</Link>
          <Link href="/help"><SiteIcon name="info" size={17} />Help</Link>
          <Link className="button" href="/login">Sign in<SiteIcon name="right" size={16} /></Link>
        </>}
      </div>
      <details className="mobile-menu" ref={menu} onToggle={event => setMenuOpen((event.target as HTMLDetailsElement).open)}>
        <summary aria-controls="mobile-navigation" aria-expanded={menuOpen} aria-haspopup="dialog" aria-label={menuOpen ? 'Close site menu. Press Escape to close.' : 'Open site menu'}>{menuOpen ? 'Close' : 'Menu'}<SiteIcon name={menuOpen ? 'close' : 'menu'} size={18} /></summary>
        <nav id="mobile-navigation" aria-label="Mobile navigation" role={menuOpen ? 'dialog' : undefined} aria-modal={menuOpen || undefined} aria-labelledby={menuOpen ? 'mobile-menu-title' : undefined} aria-hidden={menuOpen ? undefined : true} inert={menuOpen ? undefined : true}>
          {menuOpen && <p id="mobile-menu-title" className="sr-only">Site menu. Press Escape to close.</p>}
          {links.map(([href, label]) => <Link href={href} key={href} aria-current={current(href) ? 'page' : undefined} onClick={closeMenu}>{label}</Link>)}
          <span className="mobile-nav-label">{signedIn ? 'Your space' : 'Sign in'}</span>
          {signedIn
            ? <>
              {accountLinks.map(([href, label]) => {
                const text = href === '/notifications' && unread > 0 ? `${label} (${unread})` : label;
                return (
                  <Link
                    href={href}
                    key={href}
                    aria-current={current(href) ? 'page' : undefined}
                    aria-label={href === '/notifications' && unread > 0 ? `Notifications, ${unread} unread` : undefined}
                    onClick={closeMenu}
                  >
                    {text}
                  </Link>
                );
              })}
              <span className="mobile-nav-label">While booking stays paused</span>
              <Link href="/guidance/start" onClick={closeMenu}>Prepare a draft</Link>
              <Link href="/tools" onClick={closeMenu}>Free tools</Link>
              <Link href="/how-it-works#booking-availability-how" onClick={closeMenu}>Booking updates</Link>
            </>
            : <>
              <span className="mobile-nav-label">While booking stays paused</span>
              <Link href="/how-it-works#booking-availability-how" onClick={closeMenu} title={availabilityCopy.publicStatus}>{availabilityCopy.headerLink}</Link>
              <Link href="/guidance/start" onClick={closeMenu}>Prepare a draft</Link>
              <Link href="/tools" onClick={closeMenu}>Free tools</Link>
              <Link href="/login" onClick={closeMenu}>Sign in</Link>
              <Link href="/help" onClick={closeMenu}>Help centre</Link>
              <Link href="/how-it-works" onClick={closeMenu}>How it works</Link>
              <Link href="/pricing" onClick={closeMenu}>Pricing</Link>
            </>}
          <Link href={signedIn ? '/home' : '/login'} className="button" onClick={closeMenu}>
            {signedIn ? 'My home' : 'Sign in'}
            <SiteIcon name="right" size={16} />
          </Link>
        </nav>
      </details>
    </div>
  </header>;
}
