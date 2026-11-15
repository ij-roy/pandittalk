import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GOLD, SESSION_RED, WHITE } from '@/constants/Colors';
/** Browser/native WebRTC connection status, shown only while call media is up. */
export function CallConnectionBanner({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <View
      style={[styles.banner, styles.bannerGood]}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.title, styles.titleGood]}>WebRTC media is active</Text>
      <Text style={styles.detail}>Audio and video use the direct peer connection.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'stretch',
  },
  bannerGood: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bannerWeak: {
    backgroundColor: 'rgba(214, 69, 69, 0.16)',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleGood: {
    color: GOLD,
  },
  titleWeak: {
    color: SESSION_RED,
  },
  detail: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: WHITE,
    textAlign: 'center',
  },
});
