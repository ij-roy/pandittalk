import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BG,
  BUSY_AMBER,
  DEEP_GREY,
  GOLD,
  GOLD_RING_BORDER,
  SHADOW_BLACK,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '@/constants/Colors';

export type SessionReminderBannerProps = {
  visible: boolean;
  title: string;
  body: string;
  urgent?: boolean;
  showJoinNow?: boolean;
  onJoinNow?: () => void;
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 8_000;
const MIN_TOUCH = 44;

export function SessionReminderBanner({
  visible,
  title,
  body,
  urgent = false,
  showJoinNow = false,
  onJoinNow,
  onDismiss,
}: SessionReminderBannerProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible, onDismiss, title]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: Math.max(insets.top, 8) },
        urgent ? styles.wrapUrgent : null,
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, urgent ? styles.barUrgent : null]}>
        <View style={styles.topRow}>
          <View style={styles.content}>
            <Text style={[styles.title, urgent ? styles.titleUrgent : null]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.body, urgent ? styles.bodyUrgent : null]} numberOfLines={3}>
              {body}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={onDismiss}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss reminder"
          >
            <Ionicons name="close" size={22} color={urgent ? WHITE : DEEP_GREY} />
          </TouchableOpacity>
        </View>

        {showJoinNow && onJoinNow ? (
          <TouchableOpacity
            style={[styles.joinBtn, urgent ? styles.joinBtnUrgent : null]}
            onPress={onJoinNow}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Join session now"
          >
            <Text style={[styles.joinText, urgent ? styles.joinTextUrgent : null]}>Join Now</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 12,
    paddingHorizontal: 12,
  },
  wrapUrgent: {},
  bar: {
    backgroundColor: BG,
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    gap: 10,
  },
  barUrgent: {
    backgroundColor: BUSY_AMBER,
    borderColor: GOLD_RING_BORDER,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  content: {
    flex: 1,
    paddingRight: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 4,
  },
  titleUrgent: {
    color: WHITE,
  },
  body: {
    fontSize: 13,
    color: DEEP_GREY,
    lineHeight: 18,
  },
  bodyUrgent: {
    color: 'rgba(255,255,255,0.95)',
  },
  joinBtn: {
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: TEXT_PRIMARY_DARK,
    paddingHorizontal: 16,
  },
  joinBtnUrgent: {
    backgroundColor: WHITE,
  },
  joinText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
  joinTextUrgent: {
    color: BUSY_AMBER,
  },
  dismissBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    marginRight: -6,
  },
});
