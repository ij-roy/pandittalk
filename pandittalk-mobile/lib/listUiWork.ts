/** A list header that fades in remeasures every child. Leave it off. */
export function shouldAnimateListHeader(): boolean {
  return false;
}

/** One shared pulse for a skeleton card, instead of one animation per bar. */
export function skeletonAnimations(boxCount: number): number {
  if (boxCount <= 0) return 0;
  return 1;
}

export const HOME_LIST_WINDOW = {
  initialNumToRender: 4,
  maxToRenderPerBatch: 4,
  windowSize: 5,
  updateCellsBatchingPeriod: 50,
} as const;
