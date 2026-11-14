import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CitySelectField, SearchableCityPicker } from '@/components/city/SearchableCityPicker';
import { EntertainmentDisclaimer } from '@/components/EntertainmentDisclaimer';
import { BirthDetailsPrompt } from '@/components/BirthDetailsPrompt';
import { ToolSubmitError } from '@/components/ToolSubmitError';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { KundliComparisonChart } from '@/components/kundli/KundliComparisonChart';
import { KundliMandalaSpinner } from '@/components/KundliMandalaSpinner';
import { ConfirmableDateTimePicker } from '@/components/ui/ConfirmableDateTimePicker';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { FormField } from '@/components/ui/FormField';
import { formStyles } from '@/components/ui/formStyles';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { BG, GOLD, GREY_LABEL, HEADER_RULE_GREY, TEXT_PRIMARY_DARK, WHITE } from '@/constants/Colors';
import { formatCityCoordinates } from '@/constants/indianCities';
import {
  clampBirthDate,
  clampBirthTime,
  getMaxBirthDate,
  isBirthDateTimeInFuture,
  toDateInputValue,
} from '@/lib/birthDateTime';
import { isAbortError } from '@/lib/requestCancel';
import { canPurchaseDigitalTools } from '@/lib/iosStorePolicy';
import { messageFromToolError } from '@/lib/toolSubmitError';
import { postKundli } from '@/lib/toolsApi';
import { listFamilyMembers, type FamilyMember } from '@/lib/familyApi';
import { useAuthStore } from '@/store/useAuthStore';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

type Phase = 'form' | 'loading';

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

export default function KundliScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const maxBirthDate = getMaxBirthDate();

  const [phase, setPhase] = useState<Phase>('form');
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
  const accessToken = useAuthStore((s) => s.accessToken);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setFamily([]);
      return;
    }
    let cancelled = false;
    void listFamilyMembers(accessToken)
      .then((rows) => {
        if (!cancelled) setFamily(rows);
      })
      .catch(() => {
        if (!cancelled) setFamily([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

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

  const applyFamily = useCallback((member: FamilyMember) => {
    const [first, ...rest] = member.name.trim().split(/\s+/);
    setFirstName(first ?? '');
    setLastName(rest.join(' '));
    const [y, m, d] = member.dob.split('-').map(Number);
    if (y && m && d) applyBirthDate(new Date(y, m - 1, d));
    const [h, min] = member.timeOfBirth.split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(min)) {
      const time = new Date();
      time.setHours(h, min, 0, 0);
      applyBirthTime(time);
    }
    setPlaceOfBirth(member.placeOfBirth);
    setBirthCoordinates(member.coordinates ?? undefined);
  }, [applyBirthDate, applyBirthTime]);

  const handleGenerate = useCallback(async () => {
    if (!isFormComplete || !selectedDate || !selectedTime) return;

    if (isBirthDateTimeInFuture(selectedDate, selectedTime)) {
      setSubmitError('Date of birth cannot be in the future.');
      return;
    }

    setSubmitError(null);
    setPhase('loading');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await postKundli(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dob: formatLocalYmd(selectedDate),
          timeOfBirth: formatTimeForApi(selectedTime),
          placeOfBirth,
          coordinates: birthCoordinates,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;

      router.push({
        pathname: '/tools/kundli-result',
        params: { resultJson: JSON.stringify(data) },
      });
    } catch (err) {
      if (controller.signal.aborted || isAbortError(err)) {
        setPhase('form');
        return;
      }
      setPhase('form');
      setSubmitError(messageFromToolError(err));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [birthCoordinates, firstName, isFormComplete, lastName, placeOfBirth, router, selectedDate, selectedTime]);

  const cancelGenerate = useCallback(() => {
    abortRef.current?.abort();
    setPhase('form');
  }, []);

  if (phase === 'loading') {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingTitle}>Generating Your Birth Chart</Text>
        <KundliMandalaSpinner />
        <Text style={styles.loadingSubtitle}>Preparing your astrological chart...</Text>
        <TouchableOpacity
          onPress={cancelGenerate}
          style={styles.cancelHit}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScreenBackground>
      <KeyboardAwareScreen
        headerOffset={insets.top + 12}
        bottomInset={insets.bottom + 24}
        contentContainerStyle={styles.scrollContent}
      >
        <EntertainmentDisclaimer compact />
        <BirthDetailsPrompt />
        <Text style={styles.subtitle}>Enter your birth details to generate your chart</Text>
        {family.length > 0 ? (
          <View style={styles.familyRow}>
            {family.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.familyChip}
                onPress={() => applyFamily(member)}
                accessibilityRole="button"
                accessibilityLabel={`Use ${member.name}`}
              >
                <Text style={styles.familyChipText}>{member.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {canPurchaseDigitalTools() ? (
          <>
            <KundliComparisonChart showPriceChip />
            <TouchableOpacity
              style={styles.upgradeLinkBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/tools/kundli-detailed')}
              accessibilityRole="button"
              accessibilityLabel="Get Detailed Kundli instead"
            >
              <Text style={styles.upgradeLinkText}>Get Detailed Kundli instead</Text>
            </TouchableOpacity>
          </>
        ) : null}

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

        <ToolSubmitError message={submitError} onRetry={() => void handleGenerate()} />

        <PremiumButton
          title="Generate Kundli"
          size="lg"
          onPress={handleGenerate}
          disabled={!isFormComplete}
        />

        <Text style={styles.disclaimer}>Your birth details are used only to generate your chart.</Text>
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
  subtitle: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  upgradeLinkBtn: {
    alignItems: 'center',
    paddingBottom: 20,
    marginTop: -8,
  },
  upgradeLinkText: {
    fontSize: 14,
    color: GREY_LABEL,
    fontWeight: '500',
  },
  familyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  familyChip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
  },
  familyChipText: { color: GOLD, fontWeight: '600' },
  submitError: {
    fontSize: 13,
    color: GREY_LABEL,
    marginBottom: 10,
    lineHeight: 18,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: GREY_LABEL,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
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
  cancelHit: {
    minHeight: 44,
    marginTop: 16,
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

