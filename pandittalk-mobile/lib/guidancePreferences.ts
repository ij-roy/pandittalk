const AREAS = new Set(['career', 'love', 'family', 'marriage', 'education', 'health', 'business', 'finance']);
const DEPTHS = new Set(['entry', 'standard', 'deep']);
const FORMATS = new Set(['audio', 'video']);

export type GuidancePreferences = {
  area: string;
  depth: string;
  format: string;
};

export const SAVED_GUIDANCE_NOTE =
  'Using your last topic, length, and format. Change anything you want.';

function cleanKey(value: unknown, allowed: Set<string>): string {
  if (typeof value !== 'string') return '';
  const key = value.trim().toLowerCase();
  return allowed.has(key) ? key : '';
}

export function parseGuidancePreferences(raw: string | null | undefined): GuidancePreferences | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const area = cleanKey(data.area, AREAS);
    const depth = cleanKey(data.depth, DEPTHS);
    const format = cleanKey(data.format, FORMATS);
    if (!area || !depth || !format) return null;
    return { area, depth, format };
  } catch {
    return null;
  }
}
