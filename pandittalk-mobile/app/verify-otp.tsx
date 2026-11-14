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
  formatApiConnectionError,
  getApiBase,
  parseOtpRetryAfterSeconds,
  postRequestOtp,
  verifyOtp,
} from '../lib/authApi';
import { formatCountdownMmSs, useCountdownSeconds } from '../hooks/useCountdownSeconds';
import { OTP_CELL_MIN_HEIGHT, OTP_MAX_FONT_MULTIPLIER } from '../lib/fontScaleLayout';

const LOGO_MAIN = require('../assets/images/Homepageicons/Logomain.png');

function messageFromAxiosError(err: unknown): string {
  return formatApiConnectionError(err, getApiBase());
}

export default function VerifyOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phoneDigits?: string; legalConsent?: string }>();

  const phoneDigits = (Array.isArray(params.phoneDigits) ? params.phoneDigits[0] : params.phoneDigits) ?? '';
  const legalConsentRaw = Array.isArray(params.legalConsent)
    ? params.legalConsent[0]
    : params.legalConsent;
  const acceptedLegalConsent = legalConsentRaw === '1' || legalConsentRaw === 'true';
  const phoneE164 = phoneDigits.length === 10 ? buildIndiaPhone(phoneDigits) : '';

  const [otp, setOtp] = useState(['', '', '', '']);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
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

    // Paste / autofill of multiple digits — fill from the focused cell
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

  const handleVerify = useCallback(async () => {
    if (phoneDigits.length !== 10) {
      setAuthError('Invalid phone number. Go back and try again.');
      return;
    }
    if (!acceptedLegalConsent) {
      setAuthError('Please go back and accept the Terms & Privacy Policy.');
      return;
    }
    const code = otp.join('');
    if (code.length !== 4) {
      setAuthError('Enter the 4-digit OTP.');
      return;
    }
    setAuthError(null);
    setVerifyLoading(true);
    try {
      const res = await verifyOtp(phoneE164, code, true);
      applyAuthSession(res.data);
      router.replace('/(tabs)/home' as unknown as Href);
    } catch (e) {
      const retry = parseOtpRetryAfterSeconds(e);
      if (retry != null) {
        setOtpCooldownSeconds(retry);
      }
      setAuthError(messageFromAxiosError(e));
    } finally {
      setVerifyLoading(false);
    }
  }, [phoneDigits, phoneE164, otp, acceptedLegalConsent, router]);

  const handleResend = useCallback(async () => {
    if (otpCooldownRemaining > 0 || resendLoading || !phoneE164) return;
    setAuthError(null);
    setResendLoading(true);
    try {
      await postRequestOtp(phoneE164);
      // Soft local cooldown so users don’t mash resend (server also enforces 60s).
      setOtpCooldownSeconds(60);
      setAuthError(null);
    } catch (e) {
      const retry = parseOtpRetryAfterSeconds(e);
      if (retry != null) {
        setOtpCooldownSeconds(retry);
      }
      setAuthError(messageFromAxiosError(e));
    } finally {
      setResendLoading(false);
    }
  }, [phoneE164, otpCooldownRemaining, resendLoading]);

  const bottomInset = Math.max(insets.bottom, 16);
  const { height: windowHeight } = useWindowDimensions();
  const keyboardVisible = useKeyboardVisible();
  const mainTopPad = keyboardVisible ? 8 : windowHeight * 0.15;

  if (phoneDigits.length !== 10) {
    return (
      <View style={[styles.root, styles.centered, { paddingBottom: bottomInset, paddingTop: insets.top }]}>
        <Text style={styles.missText}>Missing phone number.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back to login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <KeyboardAwareScreen
        style={styles.flex}
        headerOffset={Math.max(insets.top, 20)}
        bottomInset={bottomInset}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 20) }]}
      >
          <View style={[styles.mainAboveFooter, { paddingTop: mainTopPad }]}>
            <BrandHero
              logoSource={LOGO_MAIN}
              subtitle="We sent a verification code to your number"
            />

            <SectionRule label="Enter code" />

            <View style={styles.formBlock}>
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
                    editable={!verifyLoading}
                    selectTextOnFocus
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    importantForAutofill="yes"
                  />
                ))}
              </View>

              {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

              <View style={styles.btnSpacer} />

              <PremiumButton title="Verify OTP" onPress={handleVerify} disabled={verifyLoading} />

              <TouchableOpacity
                style={styles.changeNumber}
                activeOpacity={0.7}
                onPress={() => void handleResend()}
                disabled={otpCooldownRemaining > 0 || resendLoading}
              >
                <Text style={styles.changeNumberText}>
                  {otpCooldownRemaining > 0
                    ? `Resend code in ${formatCountdownMmSs(otpCooldownRemaining)}`
                    : resendLoading
                      ? 'Sending…'
                      : 'Resend code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.changeNumber} activeOpacity={0.7} onPress={() => router.back()}>
                <Text style={styles.changeNumberText}>Change number</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.flexSpacer} />
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  missText: {
    fontSize: 16,
    color: MUTED_GREY,
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: GREY_LABEL,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingBottom: 24,
  },
  mainAboveFooter: {
    width: '100%',
    alignSelf: 'center',
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
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: GREY_LABEL,
    lineHeight: 18,
  },
  btnSpacer: {
    height: 22,
  },
  changeNumber: {
    marginTop: 22,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  changeNumberText: {
    fontSize: 14,
    fontWeight: '500',
    color: MUTED_GREY,
  },
  flexSpacer: {
    flexGrow: 1,
    minHeight: 32,
  },
});
