import { Image } from 'expo-image';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  GREY_LABEL,
  HEADER_RULE_GREY,
  HOW_SURFACE_LIGHT,
  MUTED_GREY,
  SHADOW_BLACK,
  TEXT_PRIMARY_DARK,
} from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { PremiumButton as SharedPremiumButton } from './ui/PremiumButton';
import { PremiumCard as SharedPremiumCard } from './ui/PremiumCard';

/** Compact brand block — calm hierarchy, not billboard-sized */
export function BrandHero({
  logoSource,
  subtitle,
  compact = false,
}: {
  logoSource: number;
  subtitle: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.brandWrap, compact && styles.brandWrapCompact]}>
      <View style={[styles.logoHalo, compact && styles.logoHaloCompact]}>
        <Image source={logoSource} style={[styles.logo, compact && styles.logoCompact]} contentFit="contain" />
      </View>
      <Text style={[styles.brandName, compact && styles.brandNameCompact]}>PanditTalk</Text>
      <Text style={styles.brandSub}>{subtitle}</Text>
    </View>
  );
}

/** Centered rule with label — inspiration: clean section breaks without heavy cards */
export function SectionRule({ label }: { label: string }) {
  return (
    <View style={styles.ruleRow}>
      <View style={styles.ruleLine} />
      <Text style={styles.ruleLabel}>{label}</Text>
      <View style={styles.ruleLine} />
    </View>
  );
}

/** Optional soft surface — delegates to shared PremiumCard */
export function PremiumCard({ children }: { children: ReactNode }) {
  return <SharedPremiumCard padding={20}>{children}</SharedPremiumCard>;
}

export function PremiumButton({
  title,
  onPress,
  disabled,
  loading,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <SharedPremiumButton
      title={title}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      variant="primary"
    />
  );
}

const styles = StyleSheet.create({
  brandWrap: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  brandWrapCompact: {
    marginBottom: 16,
  },
  logoHalo: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: HOW_SURFACE_LIGHT,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HEADER_RULE_GREY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: SHADOW_BLACK,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  logoHaloCompact: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 12,
  },
  logo: {
    width: 72,
    height: 72,
  },
  logoCompact: {
    width: 72,
    height: 72,
  },
  brandName: {
    ...Typography.h1,
    letterSpacing: -0.3,
  },
  brandNameCompact: {
    fontSize: 22,
    lineHeight: 28,
  },
  brandSub: {
    marginTop: 8,
    ...Typography.bodySm,
    color: MUTED_GREY,
    textAlign: 'center',
    maxWidth: 280,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  ruleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: HEADER_RULE_GREY,
  },
  ruleLabel: {
    paddingHorizontal: 14,
    ...Typography.caption,
    color: GREY_LABEL,
    textTransform: 'uppercase',
  },
});
