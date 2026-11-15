'use client';

import { type HTMLAttributes, type PointerEvent, useRef } from 'react';

type SpotlightCardProps = HTMLAttributes<HTMLDivElement> & {
  spotlightColor?: string;
};

/** A restrained local adaptation of the React Bits Spotlight Card pattern. */
export function SpotlightCard({ children, className = '', spotlightColor = 'rgba(231, 182, 63, .18)', onPointerMove, ...props }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function trackPointer(event: PointerEvent<HTMLDivElement>) {
    const node = ref.current;
    if (node && event.pointerType !== 'touch') {
      const rect = node.getBoundingClientRect();
      node.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
      node.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
      node.style.setProperty('--spotlight-color', spotlightColor);
    }
    onPointerMove?.(event);
  }

  return <div ref={ref} className={`spotlight-card${className ? ` ${className}` : ''}`} onPointerMove={trackPointer} {...props}>{children}</div>;
}
