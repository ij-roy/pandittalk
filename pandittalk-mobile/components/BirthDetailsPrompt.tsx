import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { GOLD } from '@/constants/Colors';
import { birthDetailsPrompt, missingBirthFields } from '@/lib/birthDetailsPrompt';
import { useAuthStore } from '@/store/useAuthStore';

export function BirthDetailsPrompt() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user) as Record<string, unknown> | null;
  if (!accessToken) return null;
  const copy = birthDetailsPrompt(missingBirthFields(user));
  if (!copy) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push('/profile-setup')}
      accessibilityRole="button"
      accessibilityLabel="Add birth details"
      style={styles.wrap}
    >
      <Text style={styles.link}>{copy}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    color: GOLD,
    fontWeight: '600',
  },
});
