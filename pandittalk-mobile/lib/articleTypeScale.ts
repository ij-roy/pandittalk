/** Line height stays ahead of the font size so system text scaling does not clip the article. */
export function articleTypeScale(fontSize: number): { fontSize: number; lineHeight: number } {
  const size = Math.max(1, Math.round(fontSize));
  return { fontSize: size, lineHeight: Math.round(size * 1.5) };
}

export const ARTICLE_BODY_SIZE = 16;
export const ARTICLE_H1_SIZE = 24;
export const ARTICLE_H2_SIZE = 20;
export const ARTICLE_H3_SIZE = 18;
