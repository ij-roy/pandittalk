/** Matches GOLD in constants/Colors.ts. */
export const WALLET_PILL_BACKGROUND = '#B8942F';
/** Matches TEXT_PRIMARY_DARK. White on this gold is about 2.9:1 and fails body text. */
export const WALLET_PILL_TEXT = '#1A1A1A';
export const WALLET_PILL_FONT_SIZE = 14;

function channel(hex: string, index: number): number {
  const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
}

export function contrastRatio(background: string, foreground: string): number {
  const lighter = Math.max(luminance(background), luminance(foreground));
  const darker = Math.min(luminance(background), luminance(foreground));
  return (lighter + 0.05) / (darker + 0.05);
}
