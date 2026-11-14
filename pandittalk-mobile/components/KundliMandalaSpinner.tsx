import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

import { GOLD } from '@/constants/Colors';
import { shouldSpinMandala } from '@/lib/mandalaSpinnerMotion';

const ZODIAC_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'] as const;

type KundliMandalaSpinnerProps = {
  size?: number;
};

export function KundliMandalaSpinner({ size = 220 }: KundliMandalaSpinnerProps) {
  const [spin, setSpin] = useState(() => shouldSpinMandala(false, Platform.OS));
  const rotation = useSharedValue(0);

  useEffect(() => {
    let alive = true;
    const apply = (enabled: boolean) => {
      if (alive) setSpin(shouldSpinMandala(enabled, Platform.OS));
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(apply);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', apply);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!spin) {
      rotation.value = 0;
      return;
    }
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation, spin]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.46;
  const innerR = size * 0.32;
  const symbolR = size * 0.39;

  const chart = (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={outerR} stroke={GOLD} strokeWidth={2.5} fill="none" />
      <Circle cx={cx} cy={cy} r={innerR} stroke={GOLD} strokeWidth={1.5} fill="none" opacity={0.6} />
      {ZODIAC_SYMBOLS.map((symbol, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = cx + symbolR * Math.cos(angle);
        const y = cy + symbolR * Math.sin(angle) + 6;
        return (
          <SvgText
            key={symbol}
            x={x}
            y={y}
            fontSize={size * 0.09}
            fill={GOLD}
            textAnchor="middle"
          >
            {symbol}
          </SvgText>
        );
      })}
      <G stroke={GOLD} strokeWidth={2} strokeLinecap="round">
        {[0, 45, 90, 135].map((deg) => {
          const rad = (deg - 90) * (Math.PI / 180);
          const x1 = cx + innerR * 0.15 * Math.cos(rad);
          const y1 = cy + innerR * 0.15 * Math.sin(rad);
          const x2 = cx + innerR * 0.85 * Math.cos(rad);
          const y2 = cy + innerR * 0.85 * Math.sin(rad);
          return <Line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </G>
      <Circle cx={cx} cy={cy} r={size * 0.06} fill={GOLD} />
    </Svg>
  );

  if (!spin) {
    return <View style={{ width: size, height: size }}>{chart}</View>;
  }

  return (
    <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
      {chart}
    </Animated.View>
  );
}
