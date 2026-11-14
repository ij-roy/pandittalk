/** Live chat presence. This is not the booking slot list. */
export function presenceLabel(online: boolean): string {
  return online ? 'Online now' : 'Offline';
}

export const SLOT_LIST_HINT =
  'Pick a date, then an open time. Times are India Standard Time (IST). Online now on a profile is for chat, not this list.';
