import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BLOG_CARD_BORDER, GOLD, GREY_LABEL, SOFT_YELLOW, TEXT_PRIMARY_DARK, WHITE } from '@/constants/Colors';

import { COMPARISON_ROWS, DETAILED_KUNDLI_COST } from './kundliComparisonData';

type Props = {
  showPriceChip?: boolean;
};

export function KundliComparisonChart({ showPriceChip = false }: Props) {
  return (
    <>
      <View style={styles.comparisonCard}>
        <View style={styles.comparisonHeaderRow}>
          <Text style={[styles.comparisonHeader, styles.comparisonFreeCol]}>Free Kundli</Text>
          <Text style={[styles.comparisonHeader, styles.comparisonDetailedCol]}>Detailed</Text>
        </View>
        {COMPARISON_ROWS.map((row) => (
          <View key={row.detailed} style={styles.comparisonRow}>
            <View style={styles.comparisonFreeCol}>
              {row.free ? (
                <View style={styles.comparisonItem}>
                  <Ionicons name="checkmark-circle" size={16} color={GOLD} />
                  <Text style={styles.comparisonText}>{row.free}</Text>
                </View>
              ) : (
                <Text style={styles.comparisonEmpty}>—</Text>
              )}
            </View>
            <View style={styles.comparisonDetailedCol}>
              <View style={styles.comparisonItem}>
                <Ionicons name="checkmark-circle" size={16} color={GOLD} />
                <Text style={styles.comparisonText}>{row.detailed}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {showPriceChip ? (
        <View style={styles.priceChip}>
          <Text style={styles.priceChipText}>
            <Text style={styles.priceChipBold}>{DETAILED_KUNDLI_COST} coins</Text> per report
          </Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  comparisonCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: BLOG_CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  comparisonHeaderRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BLOG_CARD_BORDER,
  },
  comparisonHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  comparisonRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  comparisonFreeCol: {
    flex: 1,
    paddingRight: 8,
  },
  comparisonDetailedCol: {
    flex: 1,
    paddingLeft: 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: BLOG_CARD_BORDER,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  comparisonText: {
    flex: 1,
    fontSize: 13,
    color: TEXT_PRIMARY_DARK,
    lineHeight: 18,
  },
  comparisonEmpty: {
    fontSize: 13,
    color: GREY_LABEL,
    paddingLeft: 22,
  },
  priceChip: {
    alignSelf: 'center',
    backgroundColor: SOFT_YELLOW,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BLOG_CARD_BORDER,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
  },
  priceChipText: {
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
  },
  priceChipBold: {
    fontWeight: '700',
    color: GOLD,
  },
});
