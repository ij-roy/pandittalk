export const areas = ['career', 'love', 'family', 'marriage', 'education', 'health', 'business', 'finance'] as const;
export type GuidanceDraft = { area: string; notes: string; format: '' | 'chat' | 'audio' | 'video'; panditId: string; date: string };
export const draftKey = 'pandittalk.guidance.draft';
export const emptyDraft: GuidanceDraft = { area: '', notes: '', format: '', panditId: '', date: '' };

export function readDraft(): GuidanceDraft {
  try {
    const value = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
    if (!value) return { ...emptyDraft };
    const area = areas.includes(value.area) ? value.area : '';
    const format = ['chat', 'audio', 'video'].includes(value.format) ? value.format : '';
    return {
      area,
      format,
      notes: typeof value.notes === 'string' ? value.notes.slice(0, 200) : '',
      panditId: typeof value.panditId === 'string' && /^[\w-]{1,100}$/.test(value.panditId) ? value.panditId : '',
      date: typeof value.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date) ? value.date : '',
    };
  } catch { return { ...emptyDraft }; }
}

export function saveGuidanceDraft(draft: Partial<GuidanceDraft>): boolean {
  try {
    sessionStorage.setItem(draftKey, JSON.stringify({ ...readDraft(), ...draft, notes: (draft.notes ?? readDraft().notes).slice(0, 200) }));
    return true;
  } catch {
    return false;
  }
}

export function clearGuidanceDraft() {
  try { sessionStorage.removeItem(draftKey); } catch { /* ignore */ }
}
