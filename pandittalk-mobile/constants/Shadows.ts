import type { ViewStyle } from 'react-native';

import { SHADOW_BLACK } from './Colors';

export const shadowCard: ViewStyle = {
  shadowColor: SHADOW_BLACK,
  shadowOpacity: 0.11,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
};

export const shadowElevated: ViewStyle = {
  shadowColor: SHADOW_BLACK,
  shadowOpacity: 0.12,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 8 },
  elevation: 5,
};

export const shadowSubtle: ViewStyle = {
  shadowColor: SHADOW_BLACK,
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const shadowGoldGlow: ViewStyle = {
  shadowColor: SHADOW_BLACK,
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 5 },
  elevation: 3,
};
