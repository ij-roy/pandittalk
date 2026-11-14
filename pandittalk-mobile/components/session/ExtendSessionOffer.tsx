import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GOLD, TEXT_PRIMARY_DARK, WHITE } from '@/constants/Colors';
import { getBookingById } from '@/lib/bookingApi';
import { extendSessionOfferCopy } from '@/lib/extendSessionOffer';

type Props = {
  panditName: string;
  bookingId: string;
  panditId?: string;
  tone: 'light' | 'dark';
};

export function ExtendSessionOffer({ panditName, bookingId, panditId, tone }: Props) {
  const router = useRouter();
  const [resolvedId, setResolvedId] = useState(panditId ?? '');
  const copy = extendSessionOfferCopy(panditName);

  useEffect(() => {
    if (resolvedId || !bookingId) return;
    let cancelled = false;
    void getBookingById(bookingId)
      .then((booking) => {
        if (!cancelled && booking.panditId) setResolvedId(booking.panditId);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [bookingId, resolvedId]);

  return (
    <View style={[styles.wrap, tone === 'dark' ? styles.dark : styles.light]}>
      <Text style={[styles.title, tone === 'dark' ? styles.titleDark : styles.titleLight]}>
        {copy.title}
      </Text>
      {resolvedId ? (
        <TouchableOpacity
          onPress={() => router.push(`/experts/${resolvedId}`)}
          accessibilityRole="button"
          accessibilityLabel={`Book the next session with ${panditName}`}
        >
          <Text style={styles.action}>{copy.action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  light: {
    backgroundColor: '#FFF8E8',
  },
  dark: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  titleLight: {
    color: TEXT_PRIMARY_DARK,
  },
  titleDark: {
    color: WHITE,
  },
  action: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
  },
});
