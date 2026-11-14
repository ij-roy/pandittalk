export const KUNDLI_CANCELLED_MESSAGE =
  'The chart request was cancelled before it finished. You were not charged.';

export function requestClientLeft(req: {
  destroyed?: boolean;
  aborted?: boolean;
}): boolean {
  return req.destroyed === true || req.aborted === true;
}

export class DetailedKundliCancelledError extends Error {
  constructor() {
    super(KUNDLI_CANCELLED_MESSAGE);
    this.name = 'DetailedKundliCancelledError';
  }
}
