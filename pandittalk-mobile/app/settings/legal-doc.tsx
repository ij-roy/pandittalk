import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackChevron } from '@/components/BackChevron';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BG, GOLD, GOLD_BORDER, GREY_LABEL, HEADER_RULE_GREY, TEXT_PRIMARY_DARK, WARM_IVORY } from '@/constants/Colors';
import { SUPPORT_EMAIL } from '@/constants/legal';
import { DELETE_ACCOUNT_BODY } from '@/lib/deleteAccountCopy';
import { Typography } from '@/constants/Typography';

type DocKey = 'refund' | 'account-deletion' | 'disclaimer';

const DOCS: Record<
  DocKey,
  { title: string; sections: { heading: string; body: string }[] }
> = {
  refund: {
    title: 'Refund & Cancellation Policy',
    sections: [
      {
        heading: 'Introduction',
        body: 'This policy explains cancellations, refunds, and wallet credits for PanditTalk consultations. By booking or purchasing coins, you agree to this policy.',
      },
      {
        heading: 'User cancellation',
        body: 'If you cancel before the scheduled session starts, 100% of deducted coins for that booking are refunded to your PanditTalk Wallet.',
      },
      {
        heading: 'Pandit no-show',
        body: 'If the pandit does not join within 10 minutes of the scheduled start, coins for that booking are fully refunded to your wallet.',
      },
      {
        heading: 'Technical issues',
        body: 'If a live session is interrupted by platform or network issues and cannot continue, unused time is refunded proportionately after verification.',
      },
      {
        heading: 'Wallet refunds',
        body: 'Eligible refunds are credited to your PanditTalk Wallet unless applicable law requires otherwise. Contact support if an automatic refund did not appear.',
      },
      {
        heading: 'Contact',
        body: `Email ${SUPPORT_EMAIL} with your registered mobile number and booking ID.`,
      },
    ],
  },
  'account-deletion': {
    title: 'Account & Data Deletion',
    sections: [
      {
        heading: 'How to delete',
        body: `Open Settings, then Delete Account, then confirm. ${DELETE_ACCOUNT_BODY}`,
      },
      {
        heading: 'What is removed',
        body: 'Profile details, phone number, birth data, palm images, and saved reports where permitted. Chat history is removed or anonymized where legally allowed.',
      },
      {
        heading: 'What may be retained',
        body: 'Limited records may be kept for legal, tax, fraud-prevention, dispute, or accounting obligations. Retained data is not used for marketing.',
      },
      {
        heading: 'Need help?',
        body: `If you cannot access the app, email ${SUPPORT_EMAIL} with subject “Account deletion request”.`,
      },
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    sections: [
      {
        heading: 'Entertainment & spiritual guidance',
        body: 'PanditTalk provides astrology and spiritual guidance for entertainment and personal reflection. It is not medical, legal, psychological, or financial advice.',
      },
      {
        heading: 'No guarantees',
        body: 'Results, readings, and consultations are interpretive. Outcomes are not guaranteed. Always use your own judgment and consult licensed professionals for serious decisions.',
      },
      {
        heading: 'Age',
        body: 'You must be 18 years or older to create an account and use live consultations.',
      },
    ],
  },
};

export default function LegalDocScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const raw = useLocalSearchParams<{ doc?: string }>();
  const docKey = (Array.isArray(raw.doc) ? raw.doc[0] : raw.doc) as DocKey | undefined;
  const doc = useMemo(() => (docKey && DOCS[docKey] ? DOCS[docKey] : null), [docKey]);

  if (!doc) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackChevron color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.title}>Document not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHit}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackChevron color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {doc.title}
        </Text>
        <View style={styles.backHit} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {docKey === 'refund' ? (
          <View style={styles.plainBox}>
            <Text style={styles.plainTitle}>In plain language</Text>
            <Text style={styles.body}>
              Cancel before start → full coins back to wallet. Pandit no-show (10 min) → full
              refund. Technical drop → unused time refunded after review. Refunds credit your
              wallet, not bank cash-out.
            </Text>
          </View>
        ) : null}
        {doc.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
  },
  backHit: { minWidth: 72 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: TEXT_PRIMARY_DARK,
    ...Typography.subtitle,
  },
  content: { padding: 20, paddingBottom: 40 },
  title: { ...Typography.title, color: TEXT_PRIMARY_DARK, marginTop: 16 },
  plainBox: {
    marginBottom: 20,
    padding: 14,
    borderRadius: 10,
    backgroundColor: WARM_IVORY,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GOLD_BORDER,
  },
  plainTitle: {
    ...Typography.subtitle,
    color: TEXT_PRIMARY_DARK,
    marginBottom: 8,
  },
  section: { marginBottom: 18 },
  heading: { ...Typography.subtitle, color: TEXT_PRIMARY_DARK, marginBottom: 6 },
  body: { ...Typography.body, color: GREY_LABEL, lineHeight: 22 },
});
