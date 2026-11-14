import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BANNER_GRADIENT_END,
  BANNER_GRADIENT_START,
  GOLD,
  MUTED_GREY,
  WHITE,
} from '../../constants/Colors';
import { CitySelectField, SearchableCityPicker } from '../city/SearchableCityPicker';
import { PremiumCard, SectionRule } from '../premium-auth-ui';
import { MandalaBackdrop } from '../ui/MandalaBackdrop';
import { useSheetBottomPadding } from '../../hooks/useSheetBottomPadding';
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  type GenderOption,
  type MaritalStatusValue,
} from '../../lib/profileUtils';
import { genderButtonLabel } from '../../lib/genderA11y';
import { ProfileAvatarPicker } from './ProfileAvatarPicker';
import { ProfileDateTimeFields } from './ProfileDateTimeRow';
import { profileFormStyles as styles } from './profileFormStyles';

export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  phoneLocal: string;
  email: string;
  gender: GenderOption | null;
  marital: MaritalStatusValue | null;
  selectedDate: Date;
  selectedTime: Date;
  birthPlace: string | null;
  address: string;
  city: string | null;
  postalCode: string;
};

type Props = {
  accessToken: string | null;
  avatarUri: string | null;
  onAvatarChange: (uri: string | null) => void;
  values: ProfileFormValues;
  onChange: <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => void;
  disabled?: boolean;
  googleEmail?: string | null;
  googleLinking?: boolean;
  onConnectGoogle?: () => void;
  birthPlaceOpen: boolean;
  cityOpen: boolean;
  maritalOpen: boolean;
  showDatePicker: boolean;
  showTimePicker: boolean;
  onBirthPlaceOpen: (open: boolean) => void;
  onCityOpen: (open: boolean) => void;
  onMaritalOpen: (open: boolean) => void;
  onShowDatePicker: (show: boolean) => void;
  onShowTimePicker: (show: boolean) => void;
  /** Caps account DOB (18+ marketplace gate). */
  maximumDate?: Date;
};

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

export function ProfileFormSections({
  avatarUri,
  onAvatarChange,
  values,
  onChange,
  disabled,
  googleEmail,
  googleLinking,
  onConnectGoogle,
  birthPlaceOpen,
  cityOpen,
  maritalOpen,
  showDatePicker,
  showTimePicker,
  onBirthPlaceOpen,
  onCityOpen,
  onMaritalOpen,
  onShowDatePicker,
  onShowTimePicker,
  maximumDate,
}: Props) {
  const maritalLabel =
    MARITAL_STATUS_OPTIONS.find((o) => o.value === values.marital)?.label ?? null;
  const sheetBottomPad = useSheetBottomPadding();

  return (
    <>
      <View style={styles.avatarHeaderZone}>
        <MandalaBackdrop size={240} opacity={0.06} style={styles.avatarHeaderMotif} />
        <ProfileAvatarPicker
          avatarUri={avatarUri}
          onAvatarChange={onAvatarChange}
          disabled={disabled}
        />
      </View>

      <PremiumCard>
        <View style={styles.sectionSpacing}>
          <SectionRule label="Personal" />
        </View>

        <View style={styles.fieldBlock}>
          <FieldLabel>First name</FieldLabel>
          <TextInput
            style={styles.textInput}
            placeholder="First name"
            placeholderTextColor={MUTED_GREY}
            value={values.firstName}
            onChangeText={(t) => onChange('firstName', t)}
            editable={!disabled}
          />
        </View>

        <View style={styles.fieldBlock}>
          <FieldLabel>Last name</FieldLabel>
          <TextInput
            style={styles.textInput}
            placeholder="Last name"
            placeholderTextColor={MUTED_GREY}
            value={values.lastName}
            onChangeText={(t) => onChange('lastName', t)}
            editable={!disabled}
          />
        </View>

        <View style={styles.fieldBlock}>
          <FieldLabel>Gender</FieldLabel>
          <View
            style={styles.genderRow}
            accessibilityRole="radiogroup"
            accessibilityLabel="Gender"
          >
            {GENDER_OPTIONS.map((opt) => {
              const selected = values.gender === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.genderSegment, selected && styles.genderSegmentSelected]}
                  onPress={() => onChange('gender', opt.value)}
                  activeOpacity={0.88}
                  disabled={disabled}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: !!disabled }}
                  accessibilityLabel={genderButtonLabel(opt.label, selected)}
                >
                  <FontAwesome5 name={opt.icon} size={13} color={GOLD} solid />
                  <Text
                    style={[
                      styles.genderSegmentLabel,
                      selected && styles.genderSegmentLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <FieldLabel>Phone</FieldLabel>
          <View style={styles.phoneRow}>
            <View style={styles.ccSegment}>
              <Text style={styles.ccText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone number"
              placeholderTextColor={MUTED_GREY}
              keyboardType="phone-pad"
              value={values.phoneLocal}
              onChangeText={(t) => onChange('phoneLocal', t)}
              maxLength={10}
              editable={false}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <FieldLabel>Email</FieldLabel>
          {googleEmail ? (
            <View style={styles.selectField}>
              <Text style={styles.selectValue}>{googleEmail}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectField}
              activeOpacity={0.85}
              onPress={() => !disabled && !googleLinking && onConnectGoogle?.()}
              disabled={disabled || googleLinking || !onConnectGoogle}
            >
              <Text style={[styles.selectValue, styles.selectPlaceholder]}>
                {googleLinking ? 'Connecting Google…' : 'Connect Google'}
              </Text>
              <Ionicons name="logo-google" size={16} color={GOLD} />
            </TouchableOpacity>
          )}
          <Text style={styles.fieldHint}>
            {googleEmail
              ? 'Email comes from Google or Apple Sign-In and can’t be edited here.'
              : 'Email is added by connecting Google (or Apple on iPhone). It isn’t typed manually.'}
          </Text>
        </View>

        <View style={styles.fieldBlock}>
          <FieldLabel>Marital status</FieldLabel>
          <TouchableOpacity
            style={styles.selectField}
            activeOpacity={0.85}
            onPress={() => !disabled && onMaritalOpen(true)}
            disabled={disabled}
          >
            <Text style={[styles.selectValue, !maritalLabel && styles.selectPlaceholder]}>
              {maritalLabel ?? 'Select marital status'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={GOLD} />
          </TouchableOpacity>
        </View>
      </PremiumCard>

      <PremiumCard>
        <View style={styles.sectionSpacing}>
          <SectionRule label="Birth & address" />
        </View>

        <ProfileDateTimeFields
          selectedDate={values.selectedDate}
          selectedTime={values.selectedTime}
          showDatePicker={showDatePicker}
          showTimePicker={showTimePicker}
          onOpenDatePicker={() => !disabled && onShowDatePicker(true)}
          onOpenTimePicker={() => !disabled && onShowTimePicker(true)}
          onDateChange={(d) => onChange('selectedDate', d)}
          onTimeChange={(d) => onChange('selectedTime', d)}
          onCloseDatePicker={() => onShowDatePicker(false)}
          onCloseTimePicker={() => onShowTimePicker(false)}
          disabled={disabled}
          maximumDate={maximumDate}
        />

        <CitySelectField
          label="Place of birth"
          value={values.birthPlace}
          placeholder="Select place of birth"
          onPress={() => !disabled && onBirthPlaceOpen(true)}
          disabled={disabled}
        />

        <View style={styles.fieldBlock}>
          <FieldLabel>Current address</FieldLabel>
          <TextInput
            style={styles.textInput}
            placeholder="Street address"
            placeholderTextColor={MUTED_GREY}
            value={values.address}
            onChangeText={(t) => onChange('address', t)}
            editable={!disabled}
          />
        </View>

        <CitySelectField
          label="City"
          value={values.city}
          placeholder="Select your city"
          onPress={() => !disabled && onCityOpen(true)}
          disabled={disabled}
        />

        <View style={styles.fieldBlock}>
          <FieldLabel>Postal code</FieldLabel>
          <TextInput
            style={styles.textInput}
            placeholder="PIN / postal code"
            placeholderTextColor={MUTED_GREY}
            keyboardType="number-pad"
            value={values.postalCode}
            onChangeText={(t) => onChange('postalCode', t)}
            maxLength={10}
            editable={!disabled}
          />
        </View>
      </PremiumCard>

      <SearchableCityPicker
        visible={birthPlaceOpen}
        title="Place of birth"
        selected={values.birthPlace}
        onSelect={(city) => onChange('birthPlace', city.name)}
        onClose={() => onBirthPlaceOpen(false)}
      />

      <SearchableCityPicker
        visible={cityOpen}
        title="Select city"
        selected={values.city}
        onSelect={(city) => onChange('city', city.name)}
        onClose={() => onCityOpen(false)}
      />

      <Modal transparent visible={maritalOpen} animationType="slide" onRequestClose={() => onMaritalOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => onMaritalOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: sheetBottomPad }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Marital status</Text>
            {MARITAL_STATUS_OPTIONS.map((opt) => {
              const selected = values.marital === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.maritalOption, selected && styles.maritalOptionSelected]}
                  onPress={() => {
                    onChange('marital', opt.value);
                    onMaritalOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.maritalOptionText,
                      selected && styles.maritalOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

type SaveButtonProps = {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function ProfileSaveButton({ title, loading, disabled, onPress }: SaveButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.saveButtonWrap, (disabled || loading) && styles.saveButtonDisabled]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <LinearGradient
        colors={[BANNER_GRADIENT_END, BANNER_GRADIENT_START]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.saveButton}
      >
        {loading ? (
          <ActivityIndicator color={WHITE} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
