import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AVAILABLE_GREEN, GREY_LABEL, MUTED_GREY } from '@/constants/Colors';
import { presenceLabel } from '@/lib/presenceCopy';

type Props = {
  online: boolean;
};

/** Status is an icon plus a word, so it is not carried by color alone. */
export function AvailabilityStatus({ online }: Props) {
  return (
    <View style={styles.row} accessibilityRole="text">
      <Ionicons
        name={online ? 'checkmark-circle' : 'remove-circle-outline'}
        size={14}
        color={online ? AVAILABLE_GREEN : MUTED_GREY}
      />
      <Text style={styles.label}>{presenceLabel(online)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: GREY_LABEL,
  },
});
