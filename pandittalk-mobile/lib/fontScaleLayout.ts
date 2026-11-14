export const OTP_FONT_SIZE = 22;
export const OTP_CELL_MIN_HEIGHT = 56;
export const OTP_MAX_FONT_MULTIPLIER = 1.5;
export const TAB_LABEL_MAX_FONT_MULTIPLIER = 1.35;
export const TAB_LABEL_MIN_SCALE = 0.7;

export function otpDigitFits(
  fontSize: number,
  cellMinHeight: number,
  multiplier: number,
): boolean {
  return fontSize * multiplier <= cellMinHeight;
}
