import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

/** Soft gold ring for blank lists. Stays on the first frame when Reduce Motion is on. */
export function EmptyStateAnimation() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LottieView
        source={require('@/assets/lottie/empty-soft.json')}
        autoPlay={!reduceMotion}
        loop={!reduceMotion}
        style={styles.lottie}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  lottie: {
    width: 120,
    height: 120,
  },
});
