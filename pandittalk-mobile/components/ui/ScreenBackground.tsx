import { LinearGradient } from 'expo-linear-gradient';
import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { screenBackground, screenTopGlow } from '@/constants/Gradients';

import { MandalaBackdrop, type MandalaVariant } from './MandalaBackdrop';

type ScreenBackgroundProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Show the faint mandala motif anchored top-right. Default true. */
  motif?: boolean;
  /** Which abstract motif to use, so screens can differ. Default 'wheel'. */
  motifVariant?: MandalaVariant;
  /** Soft warm anchor glow pinned to the top so screens don't open on dead space. Default true. */
  topGlow?: boolean;
};

/**
 * App-wide screen background: warm-cream vertical gradient + one faint static
 * mandala motif top-right + a soft warm top anchor glow. Replaces flat
 * `backgroundColor: BG` root views so no screen is ever flat white/grey.
 * Single reusable source for the whole app.
 */
export function ScreenBackground({
  children,
  style,
  motif = true,
  motifVariant = 'wheel',
  topGlow = true,
}: ScreenBackgroundProps) {
  return (
    <LinearGradient
      colors={screenBackground.colors}
      locations={screenBackground.locations}
      start={screenBackground.start}
      end={screenBackground.end}
      style={[styles.fill, style]}
    >
      {topGlow ? (
        <LinearGradient
          colors={screenTopGlow.colors}
          locations={screenTopGlow.locations}
          start={screenTopGlow.start}
          end={screenTopGlow.end}
          style={styles.topGlow}
          pointerEvents="none"
        />
      ) : null}
      {motif ? <MandalaBackdrop size={340} variant={motifVariant} style={styles.motif} /> : null}
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 190,
  },
  motif: {
    position: 'absolute',
    top: -90,
    right: -110,
  },
});
