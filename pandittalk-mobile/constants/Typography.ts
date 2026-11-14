import type { TextStyle } from 'react-native';

import { DEEP_GREY, GREY_LABEL, MUTED_GREY, TEXT_PRIMARY_DARK } from './Colors';

export const Typography = {
  display: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    color: TEXT_PRIMARY_DARK,
  },
  h1: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
    color: TEXT_PRIMARY_DARK,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: TEXT_PRIMARY_DARK,
  },
  h3: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    color: TEXT_PRIMARY_DARK,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: TEXT_PRIMARY_DARK,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: DEEP_GREY,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.2,
    color: GREY_LABEL,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.15,
    color: GREY_LABEL,
  },
  button: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.5,
    color: TEXT_PRIMARY_DARK,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: DEEP_GREY,
  },
} as const satisfies Record<string, TextStyle>;

export const TypographyMuted = {
  body: { ...Typography.body, color: MUTED_GREY },
  bodySm: { ...Typography.bodySm, color: MUTED_GREY },
  caption: { ...Typography.caption, color: MUTED_GREY },
} as const satisfies Record<string, TextStyle>;
