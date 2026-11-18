import { type Href, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScreen, useKeyboardVisible } from '../components/KeyboardAwareScreen';
import {
  CHIP_BORDER,
  GOLD,
  GREY_LABEL,
  MUTED_GREY,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '../constants/Colors';
import {
  getPrivacyPolicyUrl,
  getTermsUrl,
} from '../constants/legal';
import { BrandHero, PremiumButton } from '../components/premium-auth-ui';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import {
  applyAuthSession,
  buildIndiaPhone,
  formatApiConnectionError,
  getApiBase,
  isSocialPending,
  parseOtpRetryAfterSeconds,
  postAppleAuth,
  postGoogleAuth,
  postRequestOtp,
} from '../lib/authApi';
import { requestGoogleIdToken } from '../lib/googleAuth';
import { formatCountdownMmSs, useCountdownSeconds } from '../hooks/useCountdownSeconds';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Typography } from '../constants/Typography';

const LOGO_MAIN = require('../assets/images/Homepageicons/Logomain.png');

function messageFromAxiosError(err: unknown): string {
  return formatApiConnectionError(err, getApiBase());
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.authHydrated);
  const showToast = useToastStore((s) => s.showToast);
  const [phoneLocal, setPhoneLocal] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const otpCooldownRemaining = useCountdownSeconds(otpCooldownSeconds);

  useEffect(() => {
    if (otpCooldownRemaining === 0 && otpCooldownSeconds > 0) {
      setOtpCooldownSeconds(0);
      setAuthError(null);
    }
  }, [otpCooldownRemaining, otpCooldownSeconds]);

  useEffect(() => {
    if (authHydrated && accessToken) {
      router.replace('/(tabs)/home' as unknown as Href);
    }
  }, [accessToken, authHydrated, router]);

  const openLegalPage = useCallback(
    (url: string, title: string) => {
      router.push({
        pathname: '/legal-webview',
        params: { url, title },
      } as unknown as Href);
    },
    [router],
  );

  const handleGetOtp = useCallback(async () => {
    if (otpCooldownRemaining > 0) return;
    const digits = phoneLocal.replace(/\D/g, '');
    if (digits.length !== 10) {
      setAuthError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!legalAccepted) {
      setAuthError('Please accept the Terms & Conditions and Privacy Policy.');
      return;
    }
    setAuthError(null);
    setRequestLoading(true);
    try {
      const phone = buildIndiaPhone(digits);
      await postRequestOtp(phone);
      router.push({
        pathname: '/verify-otp',
        params: { phoneDigits: digits, legalConsent: '1' },
      } as unknown as Href);
    } catch (e) {
      const retry = parseOtpRetryAfterSeconds(e);
      if (retry != null) {
        setOtpCooldownSeconds(retry);
      }
      setAuthError(messageFromAxiosError(e));
    } finally {
      setRequestLoading(false);
    }
  }, [phoneLocal, legalAccepted, router, otpCooldownRemaining]);

  const canRequestOtp =
    phoneLocal.replace(/\D/g, '').length === 10 &&
    legalAccepted &&
    !requestLoading &&
    otpCooldownRemaining === 0;

  const finishAuth = useCallback(
    (data: Parameters<typeof applyAuthSession>[0]) => {
      applyAuthSession(data);
      router.replace('/(tabs)/home' as unknown as Href);
    },
    [router],
  );

  const handleGoogle = useCallback(async () => {
    if (!legalAccepted) {
      showToast('Please check the box to agree to the Terms & Privacy Policy.');
      return;
    }
    setAuthError(null);
    setRequestLoading(true);
    try {
      const idToken = await requestGoogleIdToken();
      if (!idToken) return;
      const res = await postGoogleAuth(idToken, true);
      if (isSocialPending(res.data)) {
        router.push({
          pathname: '/link-phone',
          params: { pendingToken: res.data.pendingToken },
        } as unknown as Href);
        return;
      }
      finishAuth(res.data);
    } catch (e) {
      setAuthError(messageFromAxiosError(e));
    } finally {
      setRequestLoading(false);
    }
  }, [legalAccepted, router, finishAuth, showToast]);

  const handleApple = useCallback(async () => {
    if (!legalAccepted) {
      showToast('Please check the box to agree to the Terms & Privacy Policy.');
      return;
    }
    setAuthError(null);
    setRequestLoading(true);
    try {
      const AppleAuthentication = await import('expo-apple-authentication');
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!cred.identityToken) {
        setAuthError('Apple did not return an identity token.');
        return;
      }
      const res = await postAppleAuth(
        cred.identityToken,
        true,
        cred.fullName?.givenName,
        cred.fullName?.familyName,
      );
      if (isSocialPending(res.data)) {
        router.push({
          pathname: '/link-phone',
          params: { pendingToken: res.data.pendingToken },
        } as unknown as Href);
        return;
      }
      finishAuth(res.data);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'ERR_REQUEST_CANCELED') return;
      setAuthError(messageFromAxiosError(e));
    } finally {
      setRequestLoading(false);
    }
  }, [legalAccepted, router, finishAuth, showToast]);

  const bottomInset = Math.max(insets.bottom, 16);
  const { height: windowHeight } = useWindowDimensions();
  const keyboardVisible = useKeyboardVisible();
  const mainTopPad = keyboardVisible ? 8 : Math.min(Math.max(windowHeight * 0.04, 12), 32);

  return (
    <View style={styles.root}>
      <KeyboardAwareScreen
        style={styles.flex}
        headerOffset={Math.max(insets.top, 20)}
        bottomInset={bottomInset}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 20) }]}
      >
          <View
            style={[
              styles.mainAboveFooter,
              keyboardVisible && styles.mainKeyboard,
              { paddingTop: mainTopPad },
            ]}
          >
            <BrandHero
              logoSource={LOGO_MAIN}
              subtitle="Talk to real Pandits online."
              compact
            />

            <View style={styles.authIntro}>
              <Text style={styles.title}>Sign in or create your account.</Text>
              <Text style={styles.subtitle}>
                Use your Indian mobile number to create a new account or sign in to your existing PanditTalk account.
              </Text>
            </View>

            <View style={styles.formBlock}>
              <Text style={styles.fieldLabel}>Indian mobile number (+91)</Text>
              <View style={styles.phoneCluster}>
                <View style={styles.ccPill}>
                  <Text style={styles.ccText}>+91</Text>
                  <Text style={styles.ccChevron}>▾</Text>
                </View>
                <TextInput
                  style={styles.phoneField}
                  placeholder="98765 43210"
                  placeholderTextColor={GREY_LABEL}
                  keyboardType="phone-pad"
                  value={phoneLocal}
                  onChangeText={setPhoneLocal}
                  maxLength={10}
                  editable={!requestLoading}
                />
              </View>

              <View style={styles.consentRow}>
                <Pressable
                  onPress={() => setLegalAccepted((v) => !v)}
                  disabled={requestLoading}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: legalAccepted }}
                  style={[styles.checkbox, legalAccepted && styles.checkboxChecked]}
                >
                  {legalAccepted ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </Pressable>
                <Text style={styles.consentText}>
                  {'I am 18 or older and agree to the '}
                  <Text
                    style={styles.legalLink}
                    onPress={() => openLegalPage(getTermsUrl(), 'Terms & Conditions')}
                  >
                    Terms & Conditions
                  </Text>
                  {' and '}
                  <Text
                    style={styles.legalLink}
                    onPress={() =>
                      openLegalPage(getPrivacyPolicyUrl(), 'Privacy Policy')
                    }
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>

              {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

              <View style={styles.btnSpacer} />

              <PremiumButton
                title={
                  otpCooldownRemaining > 0
                    ? `Try again in ${formatCountdownMmSs(otpCooldownRemaining)}`
                    : 'Send code'
                }
                onPress={handleGetOtp}
                disabled={!canRequestOtp}
              />

              <SocialAuthButtons
                onGoogle={handleGoogle}
                onApple={handleApple}
                disabled={requestLoading}
                dimmed={!legalAccepted}
              />
            </View>
          </View>

      </KeyboardAwareScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WHITE,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingBottom: 24,
  },
  mainAboveFooter: {
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 16,
  },
  mainKeyboard: {
    justifyContent: 'flex-start',
  },
  authIntro: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...Typography.h2,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodySm,
    marginTop: 8,
    color: MUTED_GREY,
    textAlign: 'center',
  },
  formBlock: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED_GREY,
    marginBottom: 10,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  phoneCluster: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  ccPill: {
    minWidth: 84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: WHITE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CHIP_BORDER,
  },
  ccText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  ccChevron: {
    fontSize: 11,
    color: MUTED_GREY,
    marginTop: 2,
  },
  phoneField: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: TEXT_PRIMARY_DARK,
    borderRadius: 10,
    backgroundColor: WHITE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CHIP_BORDER,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: CHIP_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
  },
  checkboxChecked: {
    borderColor: GOLD,
    backgroundColor: GOLD,
  },
  checkboxMark: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: MUTED_GREY,
    fontWeight: '400',
    textAlign: 'center',
  },
  legalLink: {
    color: GOLD,
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationColor: GOLD,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: GREY_LABEL,
    lineHeight: 18,
  },
  btnSpacer: {
    height: 12,
  },
});
