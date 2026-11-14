export function pulseAnimationAllowed(reduceMotion: boolean): boolean {
  return !reduceMotion;
}

export function progressFillDurationMs(reduceMotion: boolean): number {
  return reduceMotion ? 0 : 550;
}
