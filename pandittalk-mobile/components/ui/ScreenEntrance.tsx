import React, { type ReactNode } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';

type ScreenEntranceProps = {
  children: ReactNode;
  delay?: number;
};

export function ScreenEntrance({ children, delay = 0 }: ScreenEntranceProps) {
  return (
    <Animated.View entering={FadeInUp.duration(300).delay(delay)}>
      {children}
    </Animated.View>
  );
}
