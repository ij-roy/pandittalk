import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GOLD, GREY_LABEL } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { waitingRoomEtaLines } from '@/lib/waitingRoomEta';

type Props = {
  elapsedSeconds: number;
  style?: StyleProp<ViewStyle>;
  headlineStyle?: StyleProp<TextStyle>;
  detailStyle?: StyleProp<TextStyle>;
};

/** Waiting-room copy with soft pandit ETA + refund countdown (issue #298). */
export function WaitingForPanditStatus({
  elapsedSeconds,
  style,
  headlineStyle,
  detailStyle,
}: Props) {
  const opacity = useSharedValue(0.45);
  const { headline, detail } = waitingRoomEtaLines(elapsedSeconds);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.45, { duration: 800 })),
      -1,
      false,
    );
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[styles.wrap, style]} accessibilityRole="text">
      <Animated.Text style={[styles.headline, headlineStyle, pulseStyle]}>{headline}</Animated.Text>
      <Text style={[styles.detail, detailStyle]}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  headline: {
    ...Typography.bodySm,
    color: GOLD,
    textAlign: 'center',
    fontWeight: '600',
  },
  detail: {
    ...Typography.caption,
    color: GREY_LABEL,
    textAlign: 'center',
    lineHeight: 18,
  },
});
