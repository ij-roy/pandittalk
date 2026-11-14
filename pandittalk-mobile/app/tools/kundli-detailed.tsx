import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CitySelectField, SearchableCityPicker } from '@/components/city/SearchableCityPicker';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { BirthDetailsPrompt } from '@/components/BirthDetailsPrompt';
import { KundliComparisonChart } from '@/components/kundli/KundliComparisonChart';
import { DETAILED_KUNDLI_COST } from '@/components/kundli/kundliComparisonData';
import { KundliMandalaSpinner } from '@/components/KundliMandalaSpinner';
import { ToolsStackWalletButton } from '@/components/ToolsStackWalletButton';
import { ConfirmableDateTimePicker } from '@/components/ui/ConfirmableDateTimePicker';
import { ToolSubmitError } from '@/components/ToolSubmitError';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { FormField } from '@/components/ui/FormField';
import { formStyles } from '@/components/ui/formStyles';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { BG, BLACK, GOLD, GREY_LABEL, TEXT_PRIMARY_DARK } from '@/constants/Colors';
import { formatCityCoordinates } from '@/constants/indianCities';
import {
  clampBirthDate,
  clampBirthTime,
  getMaxBirthDate,
  isBirthDateTimeInFuture,
  toDateInputValue,
} from '@/lib/birthDateTime';
import {
  canPurchaseDigitalTools,
  IOS_DIGITAL_TOOLS_UNAVAILABLE_MESSAGE,
  IOS_DIGITAL_TOOLS_UNAVAILABLE_TITLE,
} from '@/lib/iosStorePolicy';
import { isAbortError } from '@/lib/requestCancel';
import { isOfflineSubmitError, messageFromToolError } from '@/lib/toolSubmitError';
import { ADD_COINS_LABEL, INSUFFICIENT_COINS_TITLE, insufficientCoinsBody } from '@/lib/insufficientCoins';
import { postDetailedKundli } from '@/lib/toolsApi';
import { useAuthStore } from '@/store/useAuthStore';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

type Phase = 'intro' | 'form' | 'loading';

function formatDateLabel(date: Date): string {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = MONTH_LABELS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatTimeLabel(date: Date): string {
  const hours24 = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${`${hours12}`.padStart(2, '0')}:${minutes} ${suffix}`;
}

function toTimeInputValue(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeForApi(d: Date): string {
  const h = `${d.getHours()}`.padStart(2, '0');
  const m = `${d.getMinutes()}`.padStart(2, '0');
  return `${h}:${m}`;
}

export default function KundliDetailedScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const maxBirthDate = getMaxBirthDate();

  const [phase, setPhase] = useState<Phase>('intro');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [birthCoordinates, setBirthCoordinates] = useState<string | undefined>();
  const [placeOpen, setPlaceOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const isFormComplete =
    firstName.trim().length > 0 &&
    placeOfBirth.length > 0 &&
    selectedDate !== null &&
    selectedTime !== null;

  const handleBack = useCallback(() => {
    if (phase === 'form') {
      setPhase('intro');
      return;
    }
    router.back();
  }, [phase, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerBackBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={BLACK} />
        </TouchableOpacity>
      ),
      headerRight: () => <ToolsStackWalletButton />,
    });
  }, [navigation, handleBack]);

  const applyBirthDate = useCallback(
    (date: Date) => {
      const clamped = clampBirthDate(date);
      setSelectedDate(clamped);
      setSelectedTime((prev) => (prev ? clampBirthTime(prev, clamped) : prev));
    },
    [],
  );

  const applyBirthTime = useCallback(
    (time: Date) => {
      setSelectedTime(clampBirthTime(time, selectedDate));
    },
    [selectedDate],
  );

  const generateDetailed = useCallback(async () => {
    if (!selectedDate || !selectedTime) return;

    if (!canPurchaseDigitalTools()) {
      Alert.alert(IOS_DIGITAL_TOOLS_UNAVAILABLE_TITLE, IOS_DIGITAL_TOOLS_UNAVAILABLE_MESSAGE, [
        { text: 'OK', style: 'cancel' },
        { text: 'Find Experts', onPress: () => router.push('/(tabs)/experts') },
      ]);
      return;
    }

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to generate Detailed Kundli.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]);
      return;
    }

    setSubmitError(null);
    setPhase('loading');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await postDetailedKundli(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dob: formatLocalYmd(selectedDate),
          timeOfBirth: formatTimeForApi(selectedTime),
          placeOfBirth,
          coordinates: birthCoordinates,
          detailed: true,
        },
        token,
        controller.signal,
      );
      if (controller.signal.aborted) return;

      router.push({
        pathname: '/tools/kundli-detailed-result',
        params: { resultJson: JSON.stringify(data) },
      });
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) {
        setPhase('form');
        return;
      }
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        if (msg === 'insufficient_balance') {
          setPhase('form');
          Alert.alert(
            INSUFFICIENT_COINS_TITLE,
            insufficientCoinsBody(DETAILED_KUNDLI_COST, useAuthStore.getState().walletBalance ?? 0),
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: ADD_COINS_LABEL,
                onPress: () =>
                  router.push({
                    pathname: '/wallet/recharge',
                    params: { returnTo: '/tools/kundli-detailed' },
                  }),
              },
            ],
          );
          return;
        }
        if (err.response?.status === 401) {
          setPhase('form');
          Alert.alert('Session expired', 'Please sign in again to continue.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.push('/login') },
          ]);
          return;
        }
      }
      setPhase('form');
      if (isOfflineSubmitError(err)) {
        setSubmitError(messageFromToolError(err));
      } else {
        Alert.alert(
          'Report unavailable',
          'We could not generate your detailed report. Your coins have been refunded if they were charged.',
        );
        setSubmitError(messageFromToolError(err));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [birthCoordinates, firstName, lastName, placeOfBirth, router, selectedDate, selectedTime]);

  const cancelGenerate = useCallback(() => {
    abortRef.current?.abort();
    setPhase('form');
  }, []);

  const handleGenerate = useCallback(() => {
    if (!isFormComplete || !selectedDate || !selectedTime) return;

    if (!canPurchaseDigitalTools()) {
      Alert.alert(IOS_DIGITAL_TOOLS_UNAVAILABLE_TITLE, IOS_DIGITAL_TOOLS_UNAVAILABLE_MESSAGE, [
        { text: 'OK', style: 'cancel' },
        { text: 'Find Experts', onPress: () => router.push('/(tabs)/experts') },
      ]);
      return;
    }

    setSubmitError(null);

    if (isBirthDateTimeInFuture(selectedDate, selectedTime)) {
      setSubmitError('Date of birth cannot be in the future.');
      return;
    }

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to generate Detailed Kundli.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]);
      return;
    }

    const currentBalance = useAuthStore.getState().walletBalance ?? 0;
    if (currentBalance < DETAILED_KUNDLI_COST) {
      Alert.alert(
        INSUFFICIENT_COINS_TITLE,
        insufficientCoinsBody(DETAILED_KUNDLI_COST, currentBalance),
        [
          { text: 'Cancel', style: 'cancel' },
          { text: ADD_COINS_LABEL, onPress: () => router.push({ pathname: '/wallet/recharge', params: { returnTo: '/tools/kundli-detailed' } }) },
        ],
      );
      return;
    }

    void generateDetailed();
  }, [generateDetailed, isFormComplete, router, selectedDate, selectedTime]);

  if (phase === 'loading') {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingTitle}>Generating Your Birth Chart</Text>
        <KundliMandalaSpinner />
        <Text style={styles.loadingSubtitle}>Preparing your detailed astrological chart...</Text>
        <Text style={styles.loadingNote}>Cancel returns you to the form. You are not charged.</Text>
        <TouchableOpacity
          onPress={cancelGenerate}
          style={styles.cancelHit}
          accessibilityRole="button"
          accessibilityLabel="Cancel chart generation"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'intro') {
    return (
      <ScreenBackground>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.subtitle}>See what your complete birth chart includes</Text>

          <KundliComparisonChart showPriceChip />

          <View style={styles.introCta}>
            <PremiumButton
              title="Continue"
              size="lg"
              onPress={() => setPhase('form')}
            />
          </View>

          <TouchableOpacity
            style={styles.backLinkBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/tools/kundli')}
            accessibilityRole="button"
            accessibilityLabel="Try Free Kundli instead"
          >
            <Text style={styles.backLinkText}>Try Free Kundli instead</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <KeyboardAwareScreen
        headerOffset={insets.top + 12}
        bottomInset={insets.bottom + 24}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.subtitle}>Enter your birth details for a complete chart reading</Text>
        <BirthDetailsPrompt />

        <View style={formStyles.formCard}>
          <FormField label="First Name">
            <TextInput
              style={formStyles.textInput}
              placeholder="Enter First Name"
              placeholderTextColor={GREY_LABEL}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </FormField>

          <FormField label="Last Name">
            <TextInput
              style={formStyles.textInput}
              placeholder="Enter Last Name"
              placeholderTextColor={GREY_LABEL}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </FormField>

          {Platform.OS === 'web' ? (
            <>
              <DateTimeField
                label="Date of Birth"
                icon="calendar"
                value={selectedDate ? formatDateLabel(selectedDate) : ''}
                placeholder="Select Date of Birth"
                webInput={React.createElement('input', {
                  type: 'date',
                  max: toDateInputValue(maxBirthDate),
                  value: selectedDate ? toDateInputValue(selectedDate) : '',
                  onChange: (e: { target: { value: string } }) => {
                    const dateText = e?.target?.value;
                    if (!dateText) {
                      setSelectedDate(null);
                      return;
                    }
                    const [y, m, d] = dateText.split('-').map(Number);
                    const next = new Date(selectedDate ?? new Date());
                    next.setFullYear(y, (m || 1) - 1, d || 1);
                    applyBirthDate(next);
                  },
                  style: formStyles.webInput,
                })}
              />

              <DateTimeField
                label="Time of Birth"
                icon="time-outline"
                value={selectedTime ? formatTimeLabel(selectedTime) : ''}
                placeholder="Select Time of Birth"
                webInput={React.createElement('input', {
                  type: 'time',
                  value: selectedTime ? toTimeInputValue(selectedTime) : '',
                  onChange: (e: { target: { value: string } }) => {
                    const timeText = e?.target?.value;
                    if (!timeText) {
                      setSelectedTime(null);
                      return;
                    }
                    const [h, min] = timeText.split(':').map(Number);
                    const next = new Date(selectedTime ?? new Date());
                    next.setHours(h || 0, min || 0, 0, 0);
                    applyBirthTime(next);
                  },
                  style: formStyles.webInput,
                })}
              />
            </>
          ) : (
            <>
              <DateTimeField
                label="Date of Birth"
                icon="calendar"
                value={selectedDate ? formatDateLabel(selectedDate) : ''}
                placeholder="Select Date of Birth"
                onPress={() => setShowDatePicker(true)}
              />

              <DateTimeField
                label="Time of Birth"
                icon="time-outline"
                value={selectedTime ? formatTimeLabel(selectedTime) : ''}
                placeholder="Select Time of Birth"
                onPress={() => setShowTimePicker(true)}
              />
            </>
          )}

          <FormField label="Place of Birth">
            <CitySelectField
              value={placeOfBirth || null}
              placeholder="Select Place of Birth"
              onPress={() => setPlaceOpen(true)}
            />
          </FormField>
        </View>

        <ToolSubmitError message={submitError} onRetry={() => void generateDetailed()} />

        <Text style={styles.costHint}>
          <Text style={styles.costHintAmount}>{DETAILED_KUNDLI_COST} coins</Text> per report
        </Text>

        <PremiumButton
          title="Generate Detailed Kundli"
          size="lg"
          onPress={handleGenerate}
          disabled={!isFormComplete}
        />
      </KeyboardAwareScreen>

      <SearchableCityPicker
        visible={placeOpen}
        title="Place of Birth"
        selected={placeOfBirth || null}
        onSelect={(city) => {
          setPlaceOfBirth(city.name);
          setBirthCoordinates(formatCityCoordinates(city));
        }}
        onClose={() => setPlaceOpen(false)}
      />

      <ConfirmableDateTimePicker
        visible={showDatePicker}
        value={selectedDate ?? maxBirthDate}
        mode="date"
        maximumDate={maxBirthDate}
        title="Date of birth"
        onCancel={() => setShowDatePicker(false)}
        onConfirm={(date) => {
          applyBirthDate(date);
          setShowDatePicker(false);
        }}
      />

      <ConfirmableDateTimePicker
        visible={showTimePicker}
        value={selectedTime ?? maxBirthDate}
        mode="time"
        title="Time of birth"
        onCancel={() => setShowTimePicker(false)}
        onConfirm={(date) => {
          applyBirthTime(date);
          setShowTimePicker(false);
        }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerBackBtn: {
    paddingLeft: 4,
    paddingRight: 8,
  },
  subtitle: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  submitError: {
    fontSize: 13,
    color: GREY_LABEL,
    marginBottom: 10,
    lineHeight: 18,
    textAlign: 'center',
  },
  costHint: {
    fontSize: 12,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  costHintAmount: {
    fontWeight: '600',
    color: GOLD,
  },
  introCta: {
    marginTop: 8,
    marginBottom: 12,
  },
  backLinkBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backLinkText: {
    fontSize: 14,
    color: GREY_LABEL,
    fontWeight: '500',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 32,
  },
  loadingSubtitle: {
    marginTop: 28,
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
  },
  loadingNote: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
    color: GREY_LABEL,
    textAlign: 'center',
  },
  cancelHit: {
    minHeight: 44,
    marginTop: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: GOLD,
    fontSize: 16,
    fontWeight: '700',
  },
});


