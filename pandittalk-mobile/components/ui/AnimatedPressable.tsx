import React, { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

export function AnimatedPressable({
  children,
  style,
  scaleTo = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      disabled={disabled}
      style={[style, animatedStyle, disabled ? { opacity: 0.5 } : null]}
      onPressIn={(event) => {
        if (!disabled) {
          scale.value = withSpring(scaleTo, { damping: 18, stiffness: 320 });
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, { damping: 18, stiffness: 320 });
        onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressableBase>
  );
}
