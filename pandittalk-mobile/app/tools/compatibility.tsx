import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BG, GOLD, GREY_LABEL, TEXT_PRIMARY_DARK } from '@/constants/Colors';
import { KundliMandalaSpinner } from '@/components/KundliMandalaSpinner';
import { formatCityCoordinates } from '@/constants/indianCities';
import { CitySelectField, SearchableCityPicker } from '@/components/city/SearchableCityPicker';
import { EntertainmentDisclaimer } from '@/components/EntertainmentDisclaimer';
import { BirthDetailsPrompt } from '@/components/BirthDetailsPrompt';
import { ToolSubmitError } from '@/components/ToolSubmitError';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { ConfirmableDateTimePicker } from '@/components/ui/ConfirmableDateTimePicker';
import { CoupleInviteQr } from '@/components/CoupleInviteQr';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { FormField } from '@/components/ui/FormField';
import { formStyles } from '@/components/ui/formStyles';
import { FormSectionDivider } from '@/components/ui/FormSectionDivider';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { messageFromToolError } from '@/lib/toolSubmitError';
import { postCompatibility } from '@/lib/toolsApi';
import { coupleInviteShareText, decodeCoupleInvite, encodeCoupleInvite, inviteToFormDates } from '@/lib/coupleInvite';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

type Phase = 'form' | 'loading';
type PersonKey = 'person1' | 'person2';

type PersonForm = {
  name: string;
  selectedDate: Date | null;
  selectedTime: Date | null;
  placeOfBirth: string;
  birthCoordinates?: string;
};

function emptyPerson(): PersonForm {
  return { name: '', selectedDate: null, selectedTime: null, placeOfBirth: '' };
}

function isPersonComplete(person: PersonForm): boolean {
  return (
    person.name.trim().length > 0 &&
    person.placeOfBirth.length > 0 &&
    person.selectedDate !== null &&
    person.selectedTime !== null
  );
}

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

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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

type PersonSectionProps = {
  label: string;
  person: PersonForm;
  onChangeName: (name: string) => void;
  onOpenDatePicker: () => void;
  onOpenTimePicker: () => void;
  onOpenPlacePicker: () => void;
  onDateChangeWeb: (dateText: string) => void;
  onTimeChangeWeb: (timeText: string) => void;
};

function PersonSection({
  label,
  person,
  onChangeName,
  onOpenDatePicker,
  onOpenTimePicker,
  onOpenPlacePicker,
  onDateChangeWeb,
  onTimeChangeWeb,
}: PersonSectionProps) {
  return (
    <View style={styles.personSection}>
      <FormSectionDivider label={label} />

      <View style={formStyles.formCard}>
        <FormField label="Name">
          <TextInput
            style={formStyles.textInput}
            placeholder="Enter Name"
            placeholderTextColor={GREY_LABEL}
            value={person.name}
            onChangeText={onChangeName}
            autoCapitalize="words"
          />
        </FormField>

        {Platform.OS === 'web' ? (
          <>
            <DateTimeField
              label="Date of Birth"
              icon="calendar"
              value={person.selectedDate ? formatDateLabel(person.selectedDate) : ''}
              placeholder="Select Date of Birth"
              webInput={React.createElement('input', {
                type: 'date',
                value: person.selectedDate ? toDateInputValue(person.selectedDate) : '',
                onChange: (e: { target: { value: string } }) => onDateChangeWeb(e?.target?.value ?? ''),
                style: formStyles.webInput,
              })}
            />

            <DateTimeField
              label="Time of Birth"
              icon="time-outline"
              value={person.selectedTime ? formatTimeLabel(person.selectedTime) : ''}
              placeholder="Select Time of Birth"
              webInput={React.createElement('input', {
                type: 'time',
                value: person.selectedTime ? toTimeInputValue(person.selectedTime) : '',
                onChange: (e: { target: { value: string } }) => onTimeChangeWeb(e?.target?.value ?? ''),
                style: formStyles.webInput,
              })}
            />
          </>
        ) : (
          <>
            <DateTimeField
              label="Date of Birth"
              icon="calendar"
              value={person.selectedDate ? formatDateLabel(person.selectedDate) : ''}
              placeholder="Select Date of Birth"
              onPress={onOpenDatePicker}
            />

            <DateTimeField
              label="Time of Birth"
              icon="time-outline"
              value={person.selectedTime ? formatTimeLabel(person.selectedTime) : ''}
              placeholder="Select Time of Birth"
              onPress={onOpenTimePicker}
            />
          </>
        )}

        <FormField label="Place of Birth">
          <CitySelectField
            value={person.placeOfBirth || null}
            placeholder="Select Place of Birth"
            onPress={onOpenPlacePicker}
          />
        </FormField>
      </View>
    </View>
  );
}

export default function CompatibilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ invite?: string }>();

  const [phase, setPhase] = useState<Phase>('form');
  const [person1, setPerson1] = useState<PersonForm>(emptyPerson);
  const [person2, setPerson2] = useState<PersonForm>(emptyPerson);
  const [placeOpenFor, setPlaceOpenFor] = useState<PersonKey | null>(null);
  const [activeDatePicker, setActiveDatePicker] = useState<PersonKey | null>(null);
  const [activeTimePicker, setActiveTimePicker] = useState<PersonKey | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteNote, setInviteNote] = useState<string | null>(null);
  const inviteAppliedRef = useRef(false);

  const isFormComplete = isPersonComplete(person1) && isPersonComplete(person2);
  const canInvite = isPersonComplete(person1) && person1.selectedDate && person1.selectedTime;
  const inviteLink = canInvite
    ? encodeCoupleInvite({
        name: person1.name.trim(),
        dob: formatLocalYmd(person1.selectedDate),
        time: formatTimeForApi(person1.selectedTime),
        place: person1.placeOfBirth,
        coordinates: person1.birthCoordinates,
      })
    : null;

  useEffect(() => {
    if (inviteAppliedRef.current) return;
    const raw = Array.isArray(params.invite) ? params.invite[0] : params.invite;
    if (!raw) return;
    const invite = decodeCoupleInvite(raw);
    const dates = invite ? inviteToFormDates(invite) : null;
    if (!invite || !dates) {
      inviteAppliedRef.current = true;
      setInviteNote('This invite could not be read. Enter both birth details.');
      return;
    }
    inviteAppliedRef.current = true;
    setPerson2({
      name: invite.name,
      selectedDate: dates.date,
      selectedTime: dates.time,
      placeOfBirth: invite.place,
      birthCoordinates: invite.coordinates,
    });
    setInviteNote(`${invite.name}'s details were added from the invite. Add yours as Person 1.`);
  }, [params.invite]);

  const updatePerson = useCallback((key: PersonKey, patch: Partial<PersonForm>) => {
    if (key === 'person1') {
      setPerson1((prev) => ({ ...prev, ...patch }));
    } else {
      setPerson2((prev) => ({ ...prev, ...patch }));
    }
  }, []);

  const getPerson = useCallback(
    (key: PersonKey): PersonForm => (key === 'person1' ? person1 : person2),
    [person1, person2],
  );

  const handleCheckCompatibility = useCallback(async () => {
    if (!isFormComplete || !person1.selectedDate || !person1.selectedTime || !person2.selectedDate || !person2.selectedTime) {
      return;
    }

    setSubmitError(null);
    setPhase('loading');

    try {
      const request = {
        person1: {
          name: person1.name.trim(),
          dob: formatLocalYmd(person1.selectedDate),
          timeOfBirth: formatTimeForApi(person1.selectedTime),
          placeOfBirth: person1.placeOfBirth,
          coordinates: person1.birthCoordinates,
        },
        person2: {
          name: person2.name.trim(),
          dob: formatLocalYmd(person2.selectedDate),
          timeOfBirth: formatTimeForApi(person2.selectedTime),
          placeOfBirth: person2.placeOfBirth,
          coordinates: person2.birthCoordinates,
        },
      };
      const data = await postCompatibility(request);

      router.push({
        pathname: '/tools/compatibility-result',
        params: {
          resultJson: JSON.stringify(data),
          requestJson: JSON.stringify(request),
          person1Name: person1.name.trim(),
          person2Name: person2.name.trim(),
        },
      });
    } catch (err) {
      setPhase('form');
      setSubmitError(messageFromToolError(err));
    }
  }, [isFormComplete, person1, person2, router]);

  const activePlacePerson = placeOpenFor ? getPerson(placeOpenFor) : null;

  if (phase === 'loading') {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingTitle}>Analysing Compatibility</Text>
        <KundliMandalaSpinner />
        <Text style={styles.loadingSubtitle}>Evaluating astrological compatibility...</Text>
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
        <Text style={styles.subtitle}>Enter birth details to check compatibility</Text>
        {inviteNote ? <Text style={styles.inviteNote}>{inviteNote}</Text> : null}

        <PersonSection
          label="Person 1"
          person={person1}
          onChangeName={(name) => updatePerson('person1', { name })}
          onOpenDatePicker={() => setActiveDatePicker('person1')}
          onOpenTimePicker={() => setActiveTimePicker('person1')}
          onOpenPlacePicker={() => setPlaceOpenFor('person1')}
          onDateChangeWeb={(dateText) => {
            if (!dateText) {
              updatePerson('person1', { selectedDate: null });
              return;
            }
            const [y, m, d] = dateText.split('-').map(Number);
            const next = new Date(person1.selectedDate ?? new Date());
            next.setFullYear(y, (m || 1) - 1, d || 1);
            updatePerson('person1', { selectedDate: next });
          }}
          onTimeChangeWeb={(timeText) => {
            if (!timeText) {
              updatePerson('person1', { selectedTime: null });
              return;
            }
            const [h, min] = timeText.split(':').map(Number);
            const next = new Date(person1.selectedTime ?? new Date());
            next.setHours(h || 0, min || 0, 0, 0);
            updatePerson('person1', { selectedTime: next });
          }}
        />

        {inviteLink ? (
          <TouchableOpacity
            style={styles.inviteBtn}
            onPress={() => setInviteOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Invite your partner with a QR code"
          >
            <Text style={styles.inviteBtnText}>Invite your partner</Text>
          </TouchableOpacity>
        ) : null}

        <PersonSection
          label="Person 2"
          person={person2}
          onChangeName={(name) => updatePerson('person2', { name })}
          onOpenDatePicker={() => setActiveDatePicker('person2')}
          onOpenTimePicker={() => setActiveTimePicker('person2')}
          onOpenPlacePicker={() => setPlaceOpenFor('person2')}
          onDateChangeWeb={(dateText) => {
            if (!dateText) {
              updatePerson('person2', { selectedDate: null });
              return;
            }
            const [y, m, d] = dateText.split('-').map(Number);
            const next = new Date(person2.selectedDate ?? new Date());
            next.setFullYear(y, (m || 1) - 1, d || 1);
            updatePerson('person2', { selectedDate: next });
          }}
          onTimeChangeWeb={(timeText) => {
            if (!timeText) {
              updatePerson('person2', { selectedTime: null });
              return;
            }
            const [h, min] = timeText.split(':').map(Number);
            const next = new Date(person2.selectedTime ?? new Date());
            next.setHours(h || 0, min || 0, 0, 0);
            updatePerson('person2', { selectedTime: next });
          }}
        />

        <ToolSubmitError message={submitError} onRetry={() => void handleCheckCompatibility()} />

        <PremiumButton
          title="Check Compatibility"
          size="lg"
          onPress={handleCheckCompatibility}
          disabled={!isFormComplete}
        />
      </KeyboardAwareScreen>

      <SearchableCityPicker
        visible={placeOpenFor !== null}
        title="Place of Birth"
        selected={activePlacePerson?.placeOfBirth ?? null}
        onSelect={(city) => {
          if (placeOpenFor) {
            updatePerson(placeOpenFor, {
              placeOfBirth: city.name,
              birthCoordinates: formatCityCoordinates(city),
            });
          }
        }}
        onClose={() => setPlaceOpenFor(null)}
      />

      <ConfirmableDateTimePicker
        visible={activeDatePicker != null}
        value={
          activeDatePicker
            ? (getPerson(activeDatePicker).selectedDate ?? new Date())
            : new Date()
        }
        mode="date"
        title="Date of birth"
        onCancel={() => setActiveDatePicker(null)}
        onConfirm={(date) => {
          if (activeDatePicker) {
            updatePerson(activeDatePicker, { selectedDate: date });
          }
          setActiveDatePicker(null);
        }}
      />

      <ConfirmableDateTimePicker
        visible={activeTimePicker != null}
        value={
          activeTimePicker
            ? (getPerson(activeTimePicker).selectedTime ?? new Date())
            : new Date()
        }
        mode="time"
        title="Time of birth"
        onCancel={() => setActiveTimePicker(null)}
        onConfirm={(date) => {
          if (activeTimePicker) {
            updatePerson(activeTimePicker, { selectedTime: date });
          }
          setActiveTimePicker(null);
        }}
      />

      <Modal visible={inviteOpen && !!inviteLink} transparent animationType="fade" onRequestClose={() => setInviteOpen(false)}>
        <View style={styles.inviteBackdrop}>
          <View style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>Partner invite</Text>
            <Text style={styles.inviteBody}>
              Share this with your partner. The app fills your birth details on their phone. They add theirs.
            </Text>
            {inviteLink ? <CoupleInviteQr value={inviteLink} /> : null}
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => {
                if (!inviteLink) return;
                void Share.share({
                  message: coupleInviteShareText(person1.name, inviteLink),
                });
              }}
              accessibilityRole="button"
              accessibilityLabel="Share invite link"
            >
              <Text style={styles.inviteBtnText}>Share link</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setInviteOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close invite"
              style={styles.inviteClose}
            >
              <Text style={styles.inviteCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inviteNote: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 20,
  },
  inviteBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inviteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  inviteBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  inviteCard: {
    width: '100%',
    backgroundColor: BG,
    borderRadius: 16,
    padding: 20,
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  inviteBody: {
    fontSize: 14,
    lineHeight: 20,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 16,
  },
  inviteClose: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: GREY_LABEL,
  },
  personSection: {
    marginBottom: 8,
  },
  submitError: {
    fontSize: 13,
    color: GREY_LABEL,
    marginBottom: 10,
    lineHeight: 18,
    textAlign: 'center',
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
});

