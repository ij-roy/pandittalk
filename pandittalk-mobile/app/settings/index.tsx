import { Feather } from '@expo/vector-icons';
import { BackChevron } from '@/components/BackChevron';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BG,
  BLOG_CARD_BORDER,
  DANGER_RED,
  DEEP_GREY,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  LOGOUT_RED,
  TEXT_PRIMARY_DARK,
  TOGGLE_TRACK_OFF,
  WHITE,
} from '@/constants/Colors';
import { deleteUserProfile, logoutSession } from '@/lib/authApi';
import { APP_LANGUAGES, settingsText, type AppLanguage } from '@/lib/appLanguage';
import { loadAppLanguage, saveAppLanguage } from '@/lib/appLanguageStore';
import { requestDataExport } from '@/lib/supportApi';
import {
  getAccountDeletionUrl,
  getChangePhoneUrl,
  getDisclaimerUrl,
  getHelpCenterUrl,
  getPrivacyPolicyUrl,
  getRefundPolicyUrl,
  getTermsUrl,
  SUPPORT_EMAIL,
} from '@/constants/legal';
import {
  loadNotificationPrefs,
  NOTIFICATION_PREF_LABELS,
  NOTIFICATION_PREF_TYPES,
  saveNotificationPref,
  type NotificationPrefs,
} from '@/lib/notificationPreferences';
import { notificationPrefExample } from '@/lib/notificationPrefExamples';
import { loadQuietHoursEnabled, saveQuietHoursEnabled } from '@/lib/quietHoursStore';
import type { NotificationType } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';

const PRIVACY_URL = getPrivacyPolicyUrl();
const TERMS_URL = getTermsUrl();
const HELP_URL = getHelpCenterUrl();
const CHANGE_PHONE_URL = getChangePhoneUrl();
const REFUND_URL = getRefundPolicyUrl();
const ACCOUNT_DELETION_URL = getAccountDeletionUrl();
const DISCLAIMER_URL = getDisclaimerUrl();

function SettingsRow({
  label,
  subtitle,
  onPress,
  danger,
  showChevron = true,
}: {
  label: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <View style={styles.rowTextCol}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {showChevron && onPress ? (
        <Feather name="chevron-right" size={18} color={danger ? DANGER_RED : GREY_LABEL} />
      ) : null}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [quietHours, setQuietHours] = useState(true);
  const [language, setLanguage] = useState<AppLanguage>('en');
  const copy = useCallback((key: Parameters<typeof settingsText>[1]) => settingsText(language, key), [language]);

  useEffect(() => {
    void loadNotificationPrefs().then(setPrefs);
    void loadQuietHoursEnabled().then(setQuietHours);
    void loadAppLanguage().then(setLanguage);
  }, []);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber =
    Constants.nativeBuildVersion ??
    Constants.expoConfig?.android?.versionCode?.toString() ??
    Constants.expoConfig?.ios?.buildNumber ??
    '—';

  const onTogglePref = useCallback(async (type: NotificationType, enabled: boolean) => {
    const next = await saveNotificationPref(type, enabled);
    setPrefs(next);
  }, []);

  const onLogout = useCallback(() => {
    Alert.alert(copy('logoutTitle'), copy('logoutRecovery'), [
      { text: copy('logoutCancel'), style: 'cancel' },
      {
        text: copy('logoutConfirm'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await logoutSession();
            router.replace('/login');
          })();
        },
      },
    ]);
  }, [copy, router]);

  const onDeleteAccount = useCallback(() => {
    if (!accessToken) {
      Alert.alert('Sign in required', 'Please log in to delete your account.');
      return;
    }

    Alert.alert(copy('deleteTitle'), copy('deleteBody'), [
      { text: copy('deleteCancel'), style: 'cancel' },
      {
        text: copy('deleteConfirm'),
        style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteUserProfile(accessToken);
                await logoutSession();
                router.replace('/login');
              } catch (err) {
                Alert.alert(
                  'Could not delete account',
                  err instanceof Error ? err.message : 'Please try again later.',
                );
              }
            })();
          },
        },
      ],
    );
  }, [accessToken, copy, router]);

  const onExportMyData = useCallback(() => {
    if (!accessToken) {
      Alert.alert('Sign in required', 'Please log in to request a data export.');
      return;
    }

    Alert.alert(
      'Export my data',
      `We will prepare a copy of your account data (profile, bookings, wallet history) and follow up at your registered contact or ${SUPPORT_EMAIL}. This usually takes a few business days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request export',
          onPress: () => {
            void (async () => {
              try {
                await requestDataExport(accessToken);
                Alert.alert(
                  'Request received',
                  `Your data export request was submitted (ticket category: data_export). Contact ${SUPPORT_EMAIL} if you need an update.`,
                );
              } catch (err) {
                Alert.alert(
                  'Could not submit request',
                  err instanceof Error ? err.message : 'Please try again later.',
                );
              }
            })();
          },
        },
      ],
    );
  }, [accessToken]);

  const openLegal = (url: string, title: string) => {
    router.push({
      pathname: '/settings/webview',
      params: { url, title },
    });
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={copy('back')}
        >
          <BackChevron />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{copy('settings')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionHeader title={copy('language')} />
        <View style={styles.card}>
          <View style={styles.languageRow} accessibilityRole="radiogroup">
            {APP_LANGUAGES.map((item) => {
              const selected = language === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.languageHit, selected && styles.languageHitSelected]}
                  onPress={() => {
                    setLanguage(item.id);
                    void saveAppLanguage(item.id);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item.label}
                >
                  <Text style={[styles.languageLabel, selected && styles.languageLabelSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <SectionHeader title={copy('account')} />
        <View style={styles.card}>
          <SettingsRow label={copy('viewProfile')} onPress={() => router.push('/(tabs)/profile')} />
          <View style={styles.divider} />
          <SettingsRow label={copy('editProfile')} onPress={() => router.push('/profile-setup')} />
          <View style={styles.divider} />
          <SettingsRow label={copy('family')} onPress={() => router.push('/settings/family')} />
          <View style={styles.divider} />
          <SettingsRow
            label={copy('changePhone')}
            onPress={() =>
              void Linking.openURL(CHANGE_PHONE_URL).catch(() =>
                Alert.alert(
                  'Change phone',
                  `Open ${CHANGE_PHONE_URL} in a browser while signed in, or email ${SUPPORT_EMAIL}.`,
                ),
              )
            }
          />
          <View style={styles.divider} />
          <SettingsRow label={copy('exportData')} onPress={onExportMyData} />
        </View>

        <SectionHeader title={copy('notifications')} />
        <View style={styles.card}>
          {NOTIFICATION_PREF_TYPES.map((type, index) => (
            <View key={type}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchLabel}>{NOTIFICATION_PREF_LABELS[type]}</Text>
                  <Text style={styles.switchExample}>{notificationPrefExample(type)}</Text>
                </View>
                <Switch
                  value={prefs?.[type] ?? true}
                  onValueChange={(v) => void onTogglePref(type, v)}
                  trackColor={{ false: TOGGLE_TRACK_OFF, true: GOLD }}
                  thumbColor={WHITE}
                  accessibilityLabel={`${NOTIFICATION_PREF_LABELS[type]}. ${notificationPrefExample(type)}`}
                />
              </View>
            </View>
          ))}
        </View>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchLabel}>{copy('quietHours')}</Text>
              <Text style={styles.switchExample}>{copy('quietHoursNote')}</Text>
            </View>
            <Switch
              value={quietHours}
              onValueChange={(enabled) => {
                setQuietHours(enabled);
                void saveQuietHoursEnabled(enabled);
              }}
              trackColor={{ false: TOGGLE_TRACK_OFF, true: GOLD }}
              thumbColor={WHITE}
              accessibilityLabel={`${copy('quietHours')}. ${copy('quietHoursNote')}`}
            />
          </View>
        </View>

        <SectionHeader title={copy('support')} />
        <View style={styles.card}>
          <SettingsRow
            label={copy('helpCenter')}
            subtitle={HELP_URL.replace(/^https?:\/\//, '')}
            onPress={() =>
              void Linking.openURL(HELP_URL).catch(() =>
                Alert.alert('Help Center', `Open ${HELP_URL} in a browser, or email ${SUPPORT_EMAIL}.`),
              )
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            label={copy('contactUs')}
            subtitle={SUPPORT_EMAIL}
            onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
        </View>

        <SectionHeader title={copy('legal')} />
        <View style={styles.card}>
          <SettingsRow
            label={copy('privacy')}
            onPress={() => openLegal(PRIVACY_URL, 'Privacy Policy')}
          />
          <View style={styles.divider} />
          <SettingsRow
            label={copy('terms')}
            onPress={() => openLegal(TERMS_URL, 'Terms of Service')}
          />
          <View style={styles.divider} />
          <SettingsRow
            label={copy('refund')}
            onPress={() => openLegal(REFUND_URL, 'Refund Policy')}
          />
          <View style={styles.divider} />
          <SettingsRow
            label={copy('disclaimer')}
            onPress={() => openLegal(DISCLAIMER_URL, 'Disclaimer')}
          />
          <View style={styles.divider} />
          <SettingsRow
            label={copy('deletionInfo')}
            onPress={() => openLegal(ACCOUNT_DELETION_URL, 'Account Deletion')}
          />
        </View>

        <SectionHeader title={copy('app')} />
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.rowLabel}>{copy('appVersion')}</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.rowLabel}>{copy('buildNumber')}</Text>
            <Text style={styles.infoValue}>{buildNumber}</Text>
          </View>
        </View>

        <SectionHeader title={copy('danger')} />
        <View style={styles.card}>
          <SettingsRow label={copy('deleteAccount')} onPress={onDeleteAccount} danger showChevron={false} />
          <Text style={styles.logoutNote}>{copy('deleteBody')}</Text>
          <View style={styles.divider} />
          <SettingsRow label={copy('logout')} onPress={onLogout} danger showChevron={false} />
          <Text style={styles.logoutNote}>{copy('logoutRecovery')}</Text>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: GREY_LABEL,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BLOG_CARD_BORDER,
    marginBottom: 8,
    overflow: 'hidden',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  languageHit: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BLOG_CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageHitSelected: {
    borderColor: GOLD,
    backgroundColor: WHITE,
  },
  languageLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: DEEP_GREY,
  },
  languageLabelSelected: {
    color: GOLD,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  logoutNote: {
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  rowTextCol: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_PRIMARY_DARK,
  },
  rowSubtitle: {
    fontSize: 13,
    color: GREY_LABEL,
  },
  rowLabelDanger: {
    color: LOGOUT_RED,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HEADER_RULE_GREY,
    marginLeft: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  switchLabel: {
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
    lineHeight: 20,
  },
  switchCopy: {
    flex: 1,
  },
  switchExample: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoValue: {
    fontSize: 15,
    color: GREY_LABEL,
    fontWeight: '500',
  },
});
