export const RECENT_TOOL_LIMIT = 3;

const FREE_TOOL_IDS = ['kundli', 'horoscope', 'compatibility', 'palm-reading', 'tarot'] as const;
const PAID_TOOL_IDS = ['detailed-kundli', 'monthly-horoscope'] as const;
const TOOL_IDS = new Set<string>([...FREE_TOOL_IDS, ...PAID_TOOL_IDS]);

export function toolIdFromPath(path: string): string | null {
  if (path.includes('kundli-detailed')) return 'detailed-kundli';
  if (path.includes('monthly-horoscope')) return 'monthly-horoscope';
  if (path.includes('/kundli')) return 'kundli';
  if (path.includes('/horoscope')) return 'horoscope';
  if (path.includes('compatibility')) return 'compatibility';
  if (path.includes('palm-reading')) return 'palm-reading';
  if (path.includes('/tarot')) return 'tarot';
  return null;
}

export function rememberTool(history: string[], id: string): string[] {
  if (!TOOL_IDS.has(id)) return history;
  return [id, ...history.filter((item) => item !== id)].slice(0, RECENT_TOOL_LIMIT);
}

export function visibleRecentTools(history: string[], canBuyPaid: boolean): string[] {
  return history.filter((id) => canBuyPaid || FREE_TOOL_IDS.includes(id as (typeof FREE_TOOL_IDS)[number]));
}
