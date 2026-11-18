'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useRef, useState } from 'react';
import { SiteIcon } from './SiteIcon';
import { availabilityCopy } from '@/content/availability';

const publicLinks = [['/pandits', 'Find a Pandit'], ['/guidance', 'Find guidance'], ['/tools', 'Tools'], ['/articles', 'Journal'], ['/our-approach', 'Our approach']] as const;
const appLinks = [['/home', 'Consult'], ['/pandits', 'Experts'], ['/guidance', 'Guidance'], ['/tools', 'Tools'], ['/articles', 'Articles']] as const;
const signedInMenuLinks = [['/account/profile', 'Profile'], ['/wallet', 'Wallet'], ['/bookings', 'Sessions'], ['/reports', 'Reports'], ['/notifications', 'Notifications'], ['/articles', 'Articles'], ['/account', 'Settings']] as const;
const profileMenuLinks = [['/account/profile', 'Profile'], ['/bookings', 'Sessions'], ['/wallet', 'Wallet'], ['/reports', 'Reports'], ['/account', 'Settings']] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const profileMenu = useRef<HTMLDetailsElement>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const primaryLinks = signedIn ? appLinks : publicLinks;
  const current = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const closeMenu = () => {
    if (menu.current) menu.current.open = false;
    if (profileMenu.current) profileMenu.current.open = false;
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!response.ok) throw new Error('Sign out failed');
      window.location.assign('/');
    } catch {
      setSigningOut(false);
    }
  };
  const mobileLink = (href: string, label: string, options?: { ariaLabel?: string; title?: string }) => (
    <Link
      href={href}
      className={`mobile-nav-link${current(href) ? ' is-current' : ''}`}
      aria-current={current(href) ? 'page' : undefined}
      aria-label={options?.ariaLabel}
      title={options?.title}
      onClick={closeMenu}
    >
      <span>{label}</span>
      <SiteIcon name="right" size={16} />
    </Link>
  );

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
      if (event.key === 'Escape' && (menu.current?.open || profileMenu.current?.open)) {
        event.preventDefault();
        const openMenu = menu.current?.open ? menu.current : profileMenu.current;
        closeMenu();
        openMenu?.querySelector('summary')?.focus();
      }
    };
    const onOutside = (event: Event) => {
      if (menu.current?.open && event.target instanceof Node && !menu.current.contains(event.target)) {
        closeMenu();
        // Outside dismiss should return keyboard users to the menu control.
        requestAnimationFrame(() => menu.current?.querySelector('summary')?.focus());
      }
      if (profileMenu.current?.open && event.target instanceof Node && !profileMenu.current.contains(event.target)) {
        profileMenu.current.open = false;
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
         {primaryLinks.map(([href, label]) => <Link href={href} key={href} aria-current={current(href) ? 'page' : undefined}>{label}</Link>)}
      </nav>
      <div className="header-account" aria-busy={signedIn === null ? true : undefined} aria-describedby="header-account-hint">
        <p id="header-account-hint" className="sr-only">Arrow keys move between account links. Escape blurs the focused link. Skip to content still targets site-content.</p>
        {signedIn ? <>
           <Link className="header-icon-link" href="/notifications" aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}>
            <SiteIcon name="bell" size={17} />
             <span className="header-control-label">{unread > 0 ? `Notifications (${unread})` : 'Notifications'}</span>
          </Link>
           <Link className="header-icon-link" href="/wallet"><SiteIcon name="coins" size={17} /><span className="header-control-label">Wallet</span></Link>
           <details className="header-profile-menu" ref={profileMenu}>
             <summary><SiteIcon name="user" size={17} /><span>Profile</span></summary>
             <div className="header-profile-panel" aria-label="Profile menu">
               <span className="header-profile-label">Your account</span>
               {profileMenuLinks.map(([href, label]) => <Link href={href} key={href} onClick={closeMenu}>{label}</Link>)}
               <button type="button" onClick={() => void handleSignOut()} disabled={signingOut}>{signingOut ? 'Signing out…' : 'Sign out'}</button>
             </div>
           </details>
        </> : <>
          <Link href="/how-it-works#booking-availability-how">{availabilityCopy.headerLink}</Link>
          <Link href="/help"><SiteIcon name="info" size={17} />Help</Link>
          <Link className="button" href="/login">Sign in<SiteIcon name="right" size={16} /></Link>
        </>}
      </div>
      <details className="mobile-menu" ref={menu} onToggle={event => setMenuOpen((event.target as HTMLDetailsElement).open)}>
        <summary aria-controls="mobile-navigation" aria-expanded={menuOpen} aria-haspopup="dialog" aria-label={menuOpen ? 'Close site menu. Press Escape to close.' : 'Open site menu'}>{menuOpen ? 'Close' : 'Menu'}<SiteIcon name={menuOpen ? 'close' : 'menu'} size={18} /></summary>
        {menuOpen && <button type="button" className="mobile-menu-backdrop" aria-label="Close site menu" onClick={closeMenu} />}
        <nav id="mobile-navigation" aria-label="Mobile navigation" role={menuOpen ? 'dialog' : undefined} aria-modal={menuOpen || undefined} aria-labelledby={menuOpen ? 'mobile-menu-title' : undefined} aria-hidden={menuOpen ? undefined : true} inert={menuOpen ? undefined : true}>
          {menuOpen && <p id="mobile-menu-title" className="sr-only">Site menu. Press Escape to close.</p>}
          {!signedIn && <div className="mobile-nav-section mobile-nav-section-primary">
            <span className="mobile-nav-label">Explore</span>
            {primaryLinks.map(([href, label]) => <Fragment key={href}>{mobileLink(href, label)}</Fragment>)}
          </div>}
          {signedIn
            ? <>
              <div className="mobile-nav-section">
                <span className="mobile-nav-label">Your space</span>
               {signedInMenuLinks.map(([href, label]) => {
                const text = href === '/notifications' && unread > 0 ? `${label} (${unread})` : label;
                return <Fragment key={href}>{mobileLink(href, text, { ariaLabel: href === '/notifications' && unread > 0 ? `Notifications, ${unread} unread` : undefined })}</Fragment>;
              })}
              </div>
              <div className="mobile-nav-section">
                 <span className="mobile-nav-label">Support</span>
                 {mobileLink('/help', 'Help centre')}
                {mobileLink('/how-it-works#booking-availability-how', 'How booking works')}
              </div>
            </>
            : <>
              <div className="mobile-nav-section">
                <span className="mobile-nav-label">Start here</span>
                {mobileLink('/how-it-works#booking-availability-how', 'How booking works')}
                {mobileLink('/guidance/start', 'Prepare a draft')}
                {mobileLink('/help', 'Help centre')}
                {mobileLink('/pricing', 'Pricing')}
              </div>
            </>}
          {!signedIn && <Link href="/login" className="button mobile-nav-cta" onClick={closeMenu}>Sign in<SiteIcon name="right" size={16} /></Link>}
        </nav>
      </details>
    </div>
  </header>;
}
