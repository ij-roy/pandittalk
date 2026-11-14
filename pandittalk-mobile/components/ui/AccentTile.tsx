import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ACCENT_ICON_PLATE, ON_ACCENT } from '@/constants/Colors';
import { accentTone, type AccentToneKey } from '@/constants/Gradients';
import { shadowCard } from '@/constants/Shadows';

import { AnimatedPressable } from './AnimatedPressable';

type AccentTileProps = {
  title: string;
  tone: AccentToneKey;
  /** SVG/image asset source (require(...)) rendered as a large white icon. */
  icon?: number;
  /** Custom icon node (e.g. an Ionicon) — overrides `icon` when provided. */
  iconNode?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  numberOfLines?: number;
  /**
   * Render a subtle deep-ink disc behind the icon. Use on light tones (gold)
   * where the icon's own color would otherwise blend into the tile.
   */
  iconPlate?: boolean;
};

/**
 * Deep-accent tile with a large white icon and label. The reusable building
 * block for Home "Areas of Guidance" and tool quick-access — gives small icons
 * real visual weight on a colored surface instead of floating in white.
 */
export function AccentTile({
  title,
  tone,
  icon,
  iconNode,
  onPress,
  style,
  iconSize = 38,
  numberOfLines = 2,
  iconPlate = false,
}: AccentTileProps) {
  const spec = accentTone[tone];

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.tile, shadowCard, style]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
    >
      <LinearGradient
        colors={spec.colors}
        start={spec.start}
        end={spec.end}
        style={styles.fill}
      >
        <View style={[styles.iconWrap, iconPlate && styles.iconPlate]}>
          {iconNode ? (
            iconNode
          ) : icon ? (
            <Image
              source={icon}
              style={{ width: iconSize, height: iconSize }}
              contentFit="contain"
              tintColor={ON_ACCENT}
            />
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={numberOfLines}>
          {title}
        </Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  iconWrap: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconPlate: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ACCENT_ICON_PLATE,
  },
  title: {
    color: ON_ACCENT,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
  },
});
