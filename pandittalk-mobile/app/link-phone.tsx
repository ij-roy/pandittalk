import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScreen, useKeyboardVisible } from '../components/KeyboardAwareScreen';
import {
  CHIP_BORDER,
  GREY_LABEL,
  HOW_BORDER_GREY,
  HOW_SURFACE_LIGHT,
  MUTED_GREY,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '../constants/Colors';
import { BrandHero, PremiumButton, SectionRule } from '../components/premium-auth-ui';
import {
  applyAuthSession,
  buildIndiaPhone,
  completeSocialAuth,
  formatApiConnectionError,
  getApiBase,
  parseOtpRetryAfterSeconds,
  postRequestOtp,
} from '../lib/authApi';
import { formatCountdownMmSs, useCountdownSeconds } from '../hooks/useCountdownSeconds';
import { OTP_CELL_MIN_HEIGHT, OTP_MAX_FONT_MULTIPLIER } from '../lib/fontScaleLayout';

const LOGO_MAIN = require('../assets/images/Homepageicons/Logomain.png');

function messageFromAxiosError(err: unknown): string {
  return formatApiConnectionError(err, getApiBase());
}

export default function LinkPhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ pendingToken?: string }>();
  const pendingToken =
    (Array.isArray(params.pendingToken) ? params.pendingToken[0] : params.pendingToken) ?? '';

  const [phoneLocal, setPhoneLocal] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const otpCooldownRemaining = useCountdownSeconds(otpCooldownSeconds);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (otpCooldownRemaining === 0 && otpCooldownSeconds > 0) {
      setOtpCooldownSeconds(0);
      setAuthError(null);
    }
  }, [otpCooldownRemaining, otpCooldownSeconds]);

  const setDigit = useCallback((index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setOtp((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    if (digits.length > 1) {
      setOtp((prev) => {
        const next = [...prev];
        const start = digits.length >= 4 ? 0 : index;
        const slice = digits.length >= 4 ? digits.slice(0, 4) : digits;
        for (let i = 0; i < slice.length && start + i < 4; i++) {
          next[start + i] = slice[i];
        }
        return next;
      });
      const focusAt = Math.min((digits.length >= 4 ? 0 : index) + Math.min(digits.length, 4) - 1, 3);
      requestAnimationFrame(() => otpRefs.current[focusAt]?.focus());
      return;
    }

    setOtp((prev) => {
      const next = [...prev];
      next[index] = digits;
      return next;
    });
    if (index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  }, []);

  const onOtpKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace' && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  const handleGetOtp = useCallback(async () => {
    if (otpCooldownRemaining > 0) return;
    const digits = phoneLocal.replace(/\D/g, '');
    if (digits.length !== 10) {
      setAuthError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!pendingToken) {
      setAuthError('Sign-in expired. Please start again.');
      return;
    }
    setAuthError(null);
    setLoading(true);
    try {
      await postRequestOtp(buildIndiaPhone(digits));
      setOtpSent(true);
    } catch (e) {
      const retry = parseOtpRetryAfterSeconds(e);
      if (retry != null) {
        setOtpCooldownSeconds(retry);
      }
      setAuthError(messageFromAxiosError(e));
    } finally {
      setLoading(false);
    }
  }, [phoneLocal, pendingToken, otpCooldownRemaining]);

  const handleVerify = useCallback(async () => {
    const digits = phoneLocal.replace(/\D/g, '');
    const code = otp.join('');
    if (digits.length !== 10 || code.length !== 4) {
      setAuthError('Enter the 4-digit OTP.');
      return;
    }
    setAuthError(null);
    setLoading(true);
    try {
      const res = await completeSocialAuth(pendingToken, buildIndiaPhone(digits), code);
      applyAuthSession(res.data);
      router.replace('/(tabs)/home' as unknown as Href);
    } catch (e) {
      const retry = parseOtpRetryAfterSeconds(e);
      if (retry != null) {
        setOtpCooldownSeconds(retry);
      }
      setAuthError(messageFromAxiosError(e));
    } finally {
      setLoading(false);
    }
  }, [phoneLocal, otp, pendingToken, router]);

  const bottomInset = Math.max(insets.bottom, 16);
  const { height: windowHeight } = useWindowDimensions();
  const keyboardVisible = useKeyboardVisible();
  const mainTopPad = keyboardVisible ? 8 : windowHeight * 0.12;
  const canRequest =
    phoneLocal.replace(/\D/g, '').length === 10 && !loading && otpCooldownRemaining === 0;

  return (
    <View style={styles.root}>
      <KeyboardAwareScreen
        style={styles.flex}
        headerOffset={Math.max(insets.top, 20)}
        bottomInset={bottomInset}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 20) }]}
      >
        <View style={[styles.main, { paddingTop: mainTopPad }]}>
          <BrandHero
            logoSource={LOGO_MAIN}
            subtitle="Confirm your mobile so we know it's you"
          />
          <SectionRule label={otpSent ? 'Enter code' : 'Verify mobile'} />

          <View style={styles.formBlock}>
            {!otpSent ? (
              <>
                <Text style={styles.fieldLabel}>Mobile number</Text>
                <View style={styles.phoneCluster}>
                  <View style={styles.ccPill}>
                    <Text style={styles.ccText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneField}
                    placeholder="Enter mobile number"
                    placeholderTextColor={GREY_LABEL}
                    keyboardType="phone-pad"
                    value={phoneLocal}
                    onChangeText={setPhoneLocal}
                    maxLength={10}
                    editable={!loading}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>4-digit OTP</Text>
                <View style={styles.otpCluster}>
                  {otp.map((d, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => {
                        otpRefs.current[i] = r;
                      }}
                      style={styles.otpCell}
                      maxFontSizeMultiplier={OTP_MAX_FONT_MULTIPLIER}
                      keyboardType="number-pad"
                      maxLength={4}
                      value={d}
                      onChangeText={(t) => setDigit(i, t)}
                      onKeyPress={({ nativeEvent }) => onOtpKeyPress(i, nativeEvent.key)}
                      editable={!loading}
                      selectTextOnFocus
                      textContentType="oneTimeCode"
                      autoComplete="sms-otp"
                      importantForAutofill="yes"
                    />
                  ))}
                </View>
              </>
            )}

            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
            <View style={styles.btnSpacer} />
            <PremiumButton
              title={
                !otpSent && otpCooldownRemaining > 0
                  ? `Try again in ${formatCountdownMmSs(otpCooldownRemaining)}`
                  : otpSent
                    ? 'Verify OTP'
                    : 'Get OTP'
              }
              onPress={otpSent ? handleVerify : handleGetOtp}
              disabled={
                otpSent
                  ? loading || otpCooldownRemaining > 0
                  : !canRequest
              }
            />
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <Text style={styles.backText}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 26, paddingBottom: 24 },
  main: { width: '100%', alignSelf: 'center' },
  formBlock: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED_GREY,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  phoneCluster: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  ccPill: {
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: WHITE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CHIP_BORDER,
  },
  ccText: { fontSize: 16, fontWeight: '600', color: TEXT_PRIMARY_DARK },
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
  otpCluster: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  otpCell: {
    flex: 1,
    minHeight: OTP_CELL_MIN_HEIGHT,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: HOW_BORDER_GREY,
    backgroundColor: HOW_SURFACE_LIGHT,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  errorText: { marginTop: 10, fontSize: 13, color: GREY_LABEL, lineHeight: 18 },
  btnSpacer: { height: 22 },
  back: { marginTop: 22, alignSelf: 'center', paddingVertical: 8 },
  backText: { fontSize: 14, fontWeight: '500', color: MUTED_GREY },
});
