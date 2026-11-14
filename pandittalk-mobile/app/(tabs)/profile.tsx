import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileViewContent } from '@/components/profile/ProfileViewContent';
import { TAB_BAR_CLEARANCE } from '@/components/profile/profileFormStyles';
import { TabTopHeader } from '@/components/TabTopHeader';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { GOLD, GREY_LABEL } from '@/constants/Colors';
import { PAGE_PAD } from '@/constants/Spacing';
import { getUserProfile } from '@/lib/authApi';
import {
  coerceProfileRecord,
  mergeCoinBalanceIntoRecord,
  messageFromAxiosError,
} from '@/lib/profileUtils';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfileViewScreen() {
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.authHydrated);
  const user = useAuthStore((s) => s.user) as Record<string, unknown> | null;
  const setUser = useAuthStore((s) => s.setUser);

  const [loading, setLoading] = useState(!user);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (mode: 'initial' | 'silent' | 'pull' = 'initial') => {
      if (!accessToken) {
        setLoading(false);
        setError('You need to be signed in.');
        return;
      }
      if (mode === 'initial') setLoading(true);
      if (mode === 'pull') setRefreshing(true);
      setError(null);
      try {
        const res = await getUserProfile(accessToken);
        const record = coerceProfileRecord(res.data);
        if (record) {
          setUser(mergeCoinBalanceIntoRecord(res.data, record));
        }
      } catch (e) {
        setError(messageFromAxiosError(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, setUser],
  );

  useFocusEffect(
    useCallback(() => {
      const mode = useAuthStore.getState().user ? 'silent' : 'initial';
      void loadProfile(mode);
    }, [loadProfile]),
  );

  return (
    <ScreenBackground>
      <TabTopHeader title="My Profile" />

      {loading || !authHydrated ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingHint}>Loading profile…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, 16) + TAB_BAR_CLEARANCE },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadProfile('pull')}
              tintColor={GOLD}
              colors={[GOLD]}
            />
          }
        >
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <ProfileViewContent user={user} />
        </ScrollView>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingHint: {
    fontSize: 14,
    color: GREY_LABEL,
  },
  scroll: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 8,
  },
  error: {
    fontSize: 13,
    color: GREY_LABEL,
    marginBottom: 12,
    lineHeight: 18,
  },
});
