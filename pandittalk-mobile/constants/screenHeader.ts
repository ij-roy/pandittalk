import type { TextStyle } from 'react-native';

import { DEEP_GREY } from './Colors';

/** Shared tab top bar title — used by `TabTopHeader` for all tab screens. */
export const tabHeaderTitleText: TextStyle = {
  flex: 1,
  marginLeft: 8,
  color: DEEP_GREY,
  fontSize: 20,
  fontWeight: '700',
};
