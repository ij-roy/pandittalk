import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { IMAGE_PLACEHOLDER } from '@/constants/Colors';

type BoxProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

function SkeletonShape({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  pulseStyle,
}: BoxProps & { pulseStyle: StyleProp<ViewStyle> }) {
  return (
    <Animated.View
      style={[styles.box, { width, height, borderRadius }, pulseStyle, style]}
    />
  );
}

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: BoxProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 900 }), -1, true);
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <SkeletonShape
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
      pulseStyle={pulseStyle}
    />
  );
}

type SkeletonCardProps = {
  style?: StyleProp<ViewStyle>;
  lines?: number;
  showAvatar?: boolean;
};

export function SkeletonCard({ style, lines = 3, showAvatar = false }: SkeletonCardProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 900 }), -1, true);
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.card, style]}>
      {showAvatar ? (
        <View style={styles.row}>
          <SkeletonShape width={48} height={48} borderRadius={24} pulseStyle={pulseStyle} />
          <View style={styles.lines}>
            <SkeletonShape width="55%" height={14} pulseStyle={pulseStyle} />
            <SkeletonShape width="40%" height={12} style={styles.lineGap} pulseStyle={pulseStyle} />
          </View>
        </View>
      ) : null}
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonShape
          key={i}
          width={i === lines - 1 ? '70%' : '100%'}
          height={12}
          style={i > 0 || showAvatar ? styles.lineGap : undefined}
          pulseStyle={pulseStyle}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: IMAGE_PLACEHOLDER,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: IMAGE_PLACEHOLDER,
    opacity: 0.35,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  lines: {
    flex: 1,
    marginLeft: 12,
  },
  lineGap: {
    marginTop: 8,
  },
});
