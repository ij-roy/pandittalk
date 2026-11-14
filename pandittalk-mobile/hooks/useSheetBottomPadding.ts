import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Base bottom padding for shared action sheets (before safe-area). */
export const SHEET_PADDING_BASE = 24;

/** Bottom padding that clears the home indicator on notched iPhones (#63). */
export function useSheetBottomPadding(): number {
  const insets = useSafeAreaInsets();
  return SHEET_PADDING_BASE + Math.max(insets.bottom, 0);
}
