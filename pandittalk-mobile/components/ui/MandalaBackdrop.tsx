import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Polygon } from 'react-native-svg';

import { GOLD } from '@/constants/Colors';

/**
 * Distinct static abstracts so screens don't all share the same motif:
 * - `wheel`: concentric rings + 12 zodiac ticks (default).
 * - `yantra`: interlocking square + diamond (8-point star) sacred geometry.
 */
export type MandalaVariant = 'wheel' | 'yantra';

type MandalaBackdropProps = {
  size?: number;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
  variant?: MandalaVariant;
};

/**
 * Lightweight STATIC motif. Rendered once, never animated/repeated — safe for
 * Android scroll performance. Used as a faint texture by ScreenBackground and
 * HeroBanner.
 */
function MandalaBackdropBase({
  size = 320,
  color = GOLD,
  opacity = 0.07,
  style,
  variant = 'wheel',
}: MandalaBackdropProps) {
  const c = size / 2;
  const outer = size * 0.46;
  const mid = size * 0.34;
  const inner = size * 0.2;

  const square = (h: number) =>
    `${c - h},${c - h} ${c + h},${c - h} ${c + h},${c + h} ${c - h},${c + h}`;
  const diamond = (d: number) => `${c},${c - d} ${c + d},${c} ${c},${c + d} ${c - d},${c}`;

  return (
    <View style={[styles.wrap, { width: size, height: size, opacity }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {variant === 'yantra' ? (
          <G stroke={color} fill="none">
            <Circle cx={c} cy={c} r={outer} strokeWidth={1.5} />
            <Circle cx={c} cy={c} r={inner} strokeWidth={1} />
            <Polygon points={square(outer * 0.74)} strokeWidth={1} />
            <Polygon points={diamond(outer * 0.92)} strokeWidth={1} />
            <Circle cx={c} cy={c} r={size * 0.05} strokeWidth={1} />
          </G>
        ) : (
          <>
            <Circle cx={c} cy={c} r={outer} stroke={color} strokeWidth={1.5} fill="none" />
            <Circle cx={c} cy={c} r={mid} stroke={color} strokeWidth={1} fill="none" />
            <Circle cx={c} cy={c} r={inner} stroke={color} strokeWidth={1} fill="none" />
            <G stroke={color} strokeWidth={1}>
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const x1 = c + mid * Math.cos(angle);
                const y1 = c + mid * Math.sin(angle);
                const x2 = c + outer * Math.cos(angle);
                const y2 = c + outer * Math.sin(angle);
                return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
            </G>
          </>
        )}
      </Svg>
    </View>
  );
}

export const MandalaBackdrop = React.memo(MandalaBackdropBase);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
