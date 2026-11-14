import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  GOLD,
  MUTED_GREY,
  TAB_ACTIVE,
  TAB_BAR_BG,
  TAB_BAR_BORDER,
} from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import {
  TAB_LABEL_MAX_FONT_MULTIPLIER,
  TAB_LABEL_MIN_SCALE,
} from '@/lib/fontScaleLayout';

type TabIcon = {
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
};

const TAB_ICON_BY_ROUTE: Record<string, TabIcon> = {
  index: { active: 'home', inactive: 'home-outline' },
  experts: { active: 'people', inactive: 'people-outline' },
  tools: { active: 'apps', inactive: 'apps-outline' },
  guidance: { active: 'compass', inactive: 'compass-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

/** Expo Router paths for each tab (fixes navigation when JS name != URL segment). */
const TAB_HREF: Record<string, Href> = {
  index: '/',
  experts: '/experts',
  tools: '/tools',
  guidance: '/guidance',
  profile: '/profile',
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const focusedRouteName = state.routes[state.index]?.name;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        if (route.name === 'home') return null;

        const { options } = descriptors[route.key];
        const label =
          typeof options.title === 'string' ? options.title : route.name;
        const focused =
          route.name === 'index'
            ? focusedRouteName === 'index' || focusedRouteName === 'home'
            : state.index === index;
        const icon = TAB_ICON_BY_ROUTE[route.name];
        const href = TAB_HREF[route.name];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (event.defaultPrevented) return;
          if (focused) return;
          if (href != null) {
            router.navigate(href);
          } else {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <AnimatedPressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.navItem}
          >
            {focused ? <View style={styles.activeIndicator} /> : null}
            {icon != null ? (
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={24}
                color={focused ? TAB_ACTIVE : MUTED_GREY}
              />
            ) : null}

            <Text
              style={[styles.navText, focused && styles.navActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={TAB_LABEL_MIN_SCALE}
              maxFontSizeMultiplier={TAB_LABEL_MAX_FONT_MULTIPLIER}
            >
              {label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: TAB_BAR_BG,
    borderTopWidth: 1,
    borderTopColor: TAB_BAR_BORDER,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 6,
    shadowColor: GOLD,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  navItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingHorizontal: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: GOLD,
  },
  navText: {
    ...Typography.tabLabel,
    color: MUTED_GREY,
    marginTop: 2,
  },
  navActive: {
    color: TAB_ACTIVE,
    fontWeight: '700',
  },
});
