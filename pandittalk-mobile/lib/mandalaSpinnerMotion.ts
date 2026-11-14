/** Continuous SVG rotation is the expensive part. Android and Reduce Motion stay still. */
export function shouldSpinMandala(reduceMotion: boolean, os: string): boolean {
  if (reduceMotion) return false;
  return os !== 'android';
}
