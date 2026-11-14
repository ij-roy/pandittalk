import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { GOLD, ON_ACCENT } from '@/constants/Colors';
import { hero as heroGradient } from '@/constants/Gradients';
import { shadowElevated } from '@/constants/Shadows';

import { AnimatedPressable } from './AnimatedPressable';

const LOGO = require('../../assets/icon.png');

type HeroBannerProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Square the corners for true full-bleed edge-to-edge placement. */
  edgeToEdge?: boolean;
};

/**
 * Full-bleed premium hero: deep-gold gradient, faint branded logo watermark
 * behind the copy, and the app logo on the right. Reusable across Home,
 * Experts promo, etc.
 */
export function HeroBanner({
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  onPress,
  style,
  edgeToEdge = false,
}: HeroBannerProps) {
  return (
    <View style={[styles.shadowWrap, edgeToEdge && styles.square, shadowElevated, style]}>
      <LinearGradient
        colors={heroGradient.colors}
        locations={heroGradient.locations}
        start={heroGradient.start}
        end={heroGradient.end}
        style={[styles.banner, edgeToEdge && styles.square]}
      >
        <Image
          source={LOGO}
          style={styles.bgLogo}
          contentFit="cover"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {ctaLabel ? (
            <AnimatedPressable
              onPress={onPress}
              disabled={!onPress}
              style={styles.cta}
              accessibilityRole="button"
              accessibilityLabel={ctaLabel}
            >
              <Text style={styles.ctaText}>{ctaLabel}</Text>
            </AnimatedPressable>
          ) : null}
        </View>

        <View style={styles.rightLogoWrap} pointerEvents="none">
          <Image source={LOGO} style={styles.rightLogo} contentFit="cover" />
        </View>
      </LinearGradient>
    </View>
  );
}

const BG_LOGO = 220;
const RIGHT_LOGO = 138;

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 20,
  },
  square: {
    borderRadius: 0,
  },
  banner: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 24,
    paddingHorizontal: 20,
    minHeight: 168,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bgLogo: {
    position: 'absolute',
    top: -36,
    left: -48,
    width: BG_LOGO,
    height: BG_LOGO,
    borderRadius: BG_LOGO / 2,
    opacity: 0.14,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    zIndex: 2,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: ON_ACCENT,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 8,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: ON_ACCENT,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  ctaText: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rightLogoWrap: {
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
    overflow: 'visible',
    marginTop: 8,
    marginRight: -10,
  },
  rightLogo: {
    width: RIGHT_LOGO,
    height: RIGHT_LOGO,
    borderRadius: RIGHT_LOGO / 2,
  },
});
