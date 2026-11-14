import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BG,
  DEEP_GREY,
  GOLD,
  GOLD_BORDER,
  SHADOW_BLACK,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '@/constants/Colors';
import { TAB_BAR_CLEARANCE } from '@/constants/Spacing';
import { useActiveChatBooking } from '@/hooks/useActiveChatBooking';
import { getChatRouteParams } from '@/lib/chatBookingStatus';
import { useActiveChatViewStore } from '@/store/useActiveChatViewStore';

export function ActiveChatRejoinBanner() {
  const insets = useSafeAreaInsets();
  const { activeChat } = useActiveChatBooking();
  const focusedBookingId = useActiveChatViewStore((s) => s.focusedBookingId);

  if (!activeChat || focusedBookingId === activeChat.id) return null;

  const panditLabel = activeChat.panditName?.trim() || 'your pandit';

  return (
    <View
      style={[
        styles.wrap,
        { bottom: TAB_BAR_CLEARANCE + Math.max(insets.bottom, 0) - 8 },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.bar}
        activeOpacity={0.88}
        onPress={() => router.push(getChatRouteParams(activeChat))}
        accessibilityRole="button"
        accessibilityLabel={`Rejoin chat with ${panditLabel}`}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="chatbubble-ellipses" size={18} color={GOLD} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            Active chat session
          </Text>
          <Text style={styles.body} numberOfLines={1}>
            Rejoin chat with {panditLabel}
          </Text>
        </View>
        <View style={styles.joinBtn}>
          <Text style={styles.joinText}>Join Chat</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9998,
    elevation: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    shadowColor: SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_BORDER,
    marginRight: 10,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  body: {
    fontSize: 12,
    color: DEEP_GREY,
    marginTop: 1,
  },
  joinBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: GOLD,
    marginLeft: 8,
  },
  joinText: {
    fontSize: 12,
    fontWeight: '700',
    color: WHITE,
  },
});
