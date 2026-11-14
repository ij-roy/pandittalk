/**
 * Gradient tokens — single source of truth for every LinearGradient in the app.
 * Never hardcode gradient color arrays inline per screen; reference these.
 */

import {
  ACCENT_INDIGO,
  ACCENT_ROSE,
  ACCENT_SAGE,
  BG,
  GOLD,
  SCREEN_BG_BOTTOM,
  SCREEN_BG_TOP,
  SCREEN_TOP_GLOW,
} from './Colors';

type GradientPoint = { x: number; y: number };
export type GradientSpec = {
  colors: [string, string, ...string[]];
  locations?: [number, number, ...number[]];
  start: GradientPoint;
  end: GradientPoint;
};

const VERTICAL = { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } } as const;
const DIAGONAL = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } as const;

/** App-wide warm-cream screen background (top -> bottom), with gentle depth. */
export const screenBackground: GradientSpec = {
  colors: [SCREEN_BG_TOP, BG, SCREEN_BG_BOTTOM],
  locations: [0, 0.6, 1],
  ...VERTICAL,
};

/** Soft warm anchor glow pinned to the top of a screen -> transparent. */
export const screenTopGlow: GradientSpec = {
  colors: [SCREEN_TOP_GLOW, 'transparent'],
  locations: [0, 1],
  ...VERTICAL,
};

/** Hero banner — deep gold -> amber, rich and premium. */
export const hero: GradientSpec = {
  colors: ['#5C3D10', '#8A6418', '#C99A33'],
  locations: [0, 0.55, 1],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

/** Accent tile background pairs — deep, desaturated, never bright. */
export const accentGold: GradientSpec = {
  colors: ['#C09A36', GOLD],
  ...DIAGONAL,
};
export const accentIndigo: GradientSpec = {
  colors: ['#4A4870', ACCENT_INDIGO],
  ...DIAGONAL,
};
export const accentRose: GradientSpec = {
  colors: ['#B16C6C', ACCENT_ROSE],
  ...DIAGONAL,
};
export const accentSage: GradientSpec = {
  colors: ['#6E8870', ACCENT_SAGE],
  ...DIAGONAL,
};

export type AccentToneKey = 'gold' | 'indigo' | 'rose' | 'sage';

export const accentTone: Record<AccentToneKey, GradientSpec> = {
  gold: accentGold,
  indigo: accentIndigo,
  rose: accentRose,
  sage: accentSage,
};
