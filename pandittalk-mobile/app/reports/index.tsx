import { BackChevron } from '@/components/BackChevron';
import { isAxiosError } from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyStateAnimation } from '@/components/EmptyStateAnimation';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import {
  BG,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  MUTED_GREY,
  TEXT_PRIMARY_DARK,
  WARM_IVORY,
} from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { formatCoins } from '@/lib/bookingPricing';
import { canPurchaseDigitalTools } from '@/lib/iosStorePolicy';
import {
  REPORTS_EMPTY_BODY,
  REPORTS_EMPTY_TITLE,
  reportsEmptyActions,
} from '@/lib/reportsEmpty';
import {
  formatReportDate,
  getReportById,
  getReports,
  openSavedReport,
  reportTypeLabel,
  type SavedReportSummary,
} from '@/lib/reportsApi';
import { useAuthStore } from '@/store/useAuthStore';
import { buildTextPdf, latin1ToBase64, reportPlainLines } from '@/lib/reportPdf';
import { REPORT_OPEN_RETRY, reportOpenFailure } from '@/lib/reportOpenRetry';

function messageFromError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: unknown; error?: unknown } | undefined;
    const message = data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.map(String).join(', ');
    if (typeof data?.error === 'string') return data.error;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Could not load reports.';
}

function ReportRow({
  item,
  onPress,
  onShare,
  opening,
  sharing,
}: {
  item: SavedReportSummary;
  onPress: () => void;
  onShare: () => void;
  opening: boolean;
  sharing: boolean;
}) {
  return (
    <View>
      <PremiumCard onPress={onPress} style={styles.card} padding={16}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {opening ? <ActivityIndicator size="small" color={GOLD} /> : null}
        </View>
        <Text style={styles.cardType}>{reportTypeLabel(item.type)}</Text>
        {item.inputSummary ? (
          <Text style={styles.cardSummary} numberOfLines={1}>
            {item.inputSummary}
          </Text>
        ) : null}
        <View style={styles.cardMeta}>
          <Text style={styles.cardDate}>{formatReportDate(item.createdAt)}</Text>
          <Text style={styles.cardCoins}>
            {item.coinsSpent > 0 ? `${formatCoins(item.coinsSpent)} coins` : 'Free'}
          </Text>
        </View>
      </PremiumCard>
      <TouchableOpacity
        onPress={onShare}
        disabled={sharing}
        style={styles.shareHit}
        accessibilityRole="button"
        accessibilityLabel={`Share PDF of ${item.title}`}
      >
        <Text style={styles.shareText}>{sharing ? 'Preparing PDF…' : 'Share PDF'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.authHydrated);

  const [reports, setReports] = useState<SavedReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [openFailure, setOpenFailure] = useState<{ id: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!authHydrated) return;
      if (!accessToken) {
        setReports([]);
        setLoading(false);
        setRefreshing(false);
        setError('Please sign in to view your reports.');
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await getReports(accessToken);
        setReports(data);
      } catch (err) {
        setReports([]);
        setError(messageFromError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, authHydrated],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    void load(true);
  }, [load]);

  const onReportPress = useCallback(
    async (reportId: string) => {
      if (!accessToken || openingId) return;
      setOpeningId(reportId);
      setOpenFailure(null);
      try {
        const detail = await getReportById(accessToken, reportId);
        openSavedReport(router, detail);
      } catch (err) {
        setOpenFailure({ id: reportId, message: reportOpenFailure(messageFromError(err)) });
      } finally {
        setOpeningId(null);
      }
    },
    [accessToken, openingId, router],
  );

  const onShareReport = useCallback(
    async (reportId: string, title: string) => {
      if (!accessToken || sharingId) return;
      setSharingId(reportId);
      try {
        const detail = await getReportById(accessToken, reportId);
        const lines = reportPlainLines(detail.title || title, detail.payload);
        const pdf = buildTextPdf(lines);
        const directory = FileSystem.cacheDirectory;
        if (!directory) {
          Alert.alert('Could not share the PDF', 'Storage on this phone is not available.');
          return;
        }
        const path = `${directory}pandittalk-report-${reportId}.pdf`;
        await FileSystem.writeAsStringAsync(path, latin1ToBase64(pdf), {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Share.share({ title: lines[0], url: path, message: lines.join('\n') });
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (/cancel|dismiss/i.test(message)) return;
        Alert.alert('Could not share the PDF', messageFromError(err));
      } finally {
        setSharingId(null);
      }
    },
    [accessToken, sharingId],
  );

  const listPadding = { paddingBottom: insets.bottom + 24 };

  return (
    <ScreenBackground>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackChevron color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void load()} activeOpacity={0.7}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        <View style={[styles.centered, styles.emptyWrap]}>
          <EmptyStateAnimation />
          <Text style={styles.emptyTitle}>{REPORTS_EMPTY_TITLE}</Text>
          <Text style={styles.emptyBody}>{REPORTS_EMPTY_BODY}</Text>
          {reportsEmptyActions(canPurchaseDigitalTools()).map((action) => (
            <TouchableOpacity
              key={action.route}
              style={styles.emptyAction}
              onPress={() => router.push(action.route)}
              accessibilityRole="button"
              accessibilityLabel={`${action.label}. ${action.hint}`}
            >
              <Text style={styles.emptyActionLabel}>{action.label}</Text>
              <Text style={styles.emptyActionHint}>{action.hint}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, listPadding]}
          ListHeaderComponent={
            openFailure ? (
              <View style={styles.openFailure}>
                <Text style={styles.openFailureText}>{openFailure.message}</Text>
                <TouchableOpacity
                  onPress={() => void onReportPress(openFailure.id)}
                  accessibilityRole="button"
                  accessibilityLabel={REPORT_OPEN_RETRY}
                >
                  <Text style={styles.retryText}>{REPORT_OPEN_RETRY}</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
          }
          renderItem={({ item }) => (
            <ReportRow
              item={item}
              opening={openingId === item.id}
              sharing={sharingId === item.id}
              onPress={() => void onReportPress(item.id)}
              onShare={() => void onShareReport(item.id, item.title)}
            />
          )}
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
    backgroundColor: WARM_IVORY,
  },
  backHit: {
    minWidth: 72,
    paddingVertical: 6,
  },
  backText: {
    ...Typography.bodySm,
    color: GOLD,
    fontWeight: '600',
  },
  headerTitle: {
    ...Typography.h3,
    flex: 1,
    textAlign: 'center',
    color: TEXT_PRIMARY_DARK,
  },
  headerSpacer: {
    minWidth: 72,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyWrap: {
    backgroundColor: BG,
  },
  emptyTitle: {
    ...Typography.body,
    color: GREY_LABEL,
    textAlign: 'center',
  },
  emptyBody: {
    ...Typography.bodySm,
    color: MUTED_GREY,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyAction: {
    alignSelf: 'stretch',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: WARM_IVORY,
  },
  emptyActionLabel: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  emptyActionHint: {
    ...Typography.caption,
    color: GREY_LABEL,
    textAlign: 'center',
    marginTop: 4,
  },
  errorText: {
    ...Typography.body,
    color: MUTED_GREY,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    ...Typography.bodySm,
    color: GOLD,
    fontWeight: '600',
  },
  openFailure: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: WARM_IVORY,
    gap: 8,
  },
  openFailureText: {
    ...Typography.bodySm,
    color: TEXT_PRIMARY_DARK,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  card: {
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    ...Typography.h3,
    flex: 1,
    color: TEXT_PRIMARY_DARK,
  },
  cardType: {
    ...Typography.caption,
    color: GOLD,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  cardSummary: {
    ...Typography.bodySm,
    color: GREY_LABEL,
    marginTop: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  cardDate: {
    ...Typography.caption,
    color: MUTED_GREY,
    flex: 1,
  },
  cardCoins: {
    ...Typography.bodySm,
    color: TEXT_PRIMARY_DARK,
    fontWeight: '600',
  },
  shareHit: {
    alignSelf: 'flex-end',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginTop: -4,
    marginBottom: 8,
  },
  shareText: {
    ...Typography.bodySm,
    color: GOLD,
    fontWeight: '700',
  },
});
