'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const ROUTE_START_DELAY = 120;

export function SiteMotion() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pendingTimer = useRef<number | null>(null);
  const pendingRoute = useRef(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    pendingRoute.current = false;
    if (pendingTimer.current !== null) window.clearTimeout(pendingTimer.current);
    pendingTimer.current = null;
    setVisible(false);
  }, [routeKey]);

  useEffect(() => {
    const clearRouteProgress = () => {
      pendingRoute.current = false;
      if (pendingTimer.current !== null) window.clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
      setVisible(false);
    };

    const isEligibleNavigation = (anchor: HTMLAnchorElement, event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
      if (anchor.target && anchor.target !== '_self') return false;
      if (anchor.hasAttribute('download')) return false;
      const next = new URL(anchor.href, window.location.href);
      if (next.origin !== window.location.origin) return false;
      if (next.pathname === window.location.pathname && next.search === window.location.search) return false;
      return true;
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(target instanceof HTMLAnchorElement) || !isEligibleNavigation(target, event)) return;
      pendingRoute.current = true;
      if (pendingTimer.current !== null) window.clearTimeout(pendingTimer.current);
      pendingTimer.current = window.setTimeout(() => {
        if (pendingRoute.current && !reducedMotion) setVisible(true);
      }, ROUTE_START_DELAY);
    };

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', clearRouteProgress);
    window.addEventListener('pagehide', clearRouteProgress);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', clearRouteProgress);
      window.removeEventListener('pagehide', clearRouteProgress);
      clearRouteProgress();
    };
  }, [reducedMotion]);

  useEffect(() => {
    let frame = 0;
    const updateScrollState = () => {
      frame = 0;
      document.documentElement.dataset.scrollState = window.scrollY > 16 ? 'scrolled' : 'top';
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScrollState);
    };
    updateScrollState();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      delete document.documentElement.dataset.scrollState;
    };
  }, []);

  return <div
    id="route-progress"
    role="progressbar"
    aria-hidden="true"
    data-visible={visible ? 'true' : 'false'}
    data-reduced-motion={reducedMotion ? 'true' : 'false'}
  />;
}
