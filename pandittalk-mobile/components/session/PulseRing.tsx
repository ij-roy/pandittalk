import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GOLD } from '@/constants/Colors';
import { pulseAnimationAllowed } from '@/lib/reduceMotion';

type PulseRingProps = {
  visible: boolean;
  size: number;
};

export function PulseRing({ visible, size }: PulseRingProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!visible || !pulseAnimationAllowed(reduceMotion)) {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = 1;
      opacity.value = 0.4;
      return;
    }
    scale.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 }), withTiming(0.4, { duration: 900 })),
      -1,
      false,
    );
  }, [visible, reduceMotion, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: GOLD,
    backgroundColor: 'transparent',
  },
});
