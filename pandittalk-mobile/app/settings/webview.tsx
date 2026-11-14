import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackChevron } from '@/components/BackChevron';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView, type WebViewProps } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BG, DEEP_GREY, GOLD, HEADER_RULE_GREY } from '@/constants/Colors';
import { getHelpCenterUrl } from '@/constants/legal';
import {
  getAllowedWebViewHosts,
  isAllowedWebViewNavigation,
  resolveAllowedWebViewUrl,
} from '@/lib/webviewAllowlist';

type ShouldStartLoadRequest = Parameters<NonNullable<WebViewProps['onShouldStartLoadWithRequest']>>[0];

export default function SettingsWebViewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { url, title } = useLocalSearchParams<{ url?: string; title?: string }>();

  const allowedHosts = useMemo(() => getAllowedWebViewHosts(), []);
  const resolved = useMemo(
    () =>
      resolveAllowedWebViewUrl(
        typeof url === 'string' ? url : undefined,
        getHelpCenterUrl(),
        allowedHosts,
      ),
    [url, allowedHosts],
  );
  const pageTitle = typeof title === 'string' && title.trim() ? title.trim() : 'Document';

  const onShouldStartLoadWithRequest = useCallback(
    (request: ShouldStartLoadRequest) =>
      isAllowedWebViewNavigation(request.url, allowedHosts),
    [allowedHosts],
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackChevron />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pageTitle}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {resolved.ok ? (
        <WebView
          source={{ uri: resolved.url }}
          startInLoadingState
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={GOLD} />
            </View>
          )}
          style={styles.webview}
        />
      ) : (
        <View style={styles.loading}>
          <Text style={styles.blocked}>{resolved.reason}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
    backgroundColor: BG,
  },
  backHit: {
    minWidth: 72,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: DEEP_GREY,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: DEEP_GREY,
  },
  headerSpacer: {
    minWidth: 72,
  },
  webview: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
    paddingHorizontal: 24,
  },
  blocked: {
    color: DEEP_GREY,
    fontSize: 15,
    textAlign: 'center',
  },
});
