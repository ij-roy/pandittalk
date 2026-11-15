'use client';

import { type ReactNode, useEffect, useRef } from 'react';

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * A small, dependency-free adaptation of the React Bits Fade Content pattern.
 * Content is visible by default so server rendering and no-JavaScript visits
 * never lose information.
 */
export function RevealOnScroll({ children, className = '', delay = 0 }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.style.setProperty('--reveal-delay', `${Math.max(0, delay)}ms`);
    node.dataset.revealReady = 'true';

    if (reducedMotion || !('IntersectionObserver' in window)) {
      node.dataset.revealVisible = 'true';
      return;
    }

    const initiallyVisible = node.getBoundingClientRect().top < window.innerHeight * 0.92;
    node.dataset.revealVisible = initiallyVisible ? 'true' : 'false';

    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      node.dataset.revealVisible = 'true';
      window.clearTimeout(fallback);
      observer.disconnect();
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

    const fallback = window.setTimeout(() => {
      node.dataset.revealVisible = 'true';
      observer.disconnect();
    }, 1600 + Math.max(0, delay));

    if (!initiallyVisible) observer.observe(node);
    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, [delay]);

  return <div ref={ref} className={`reveal-on-scroll${className ? ` ${className}` : ''}`}>{children}</div>;
}
