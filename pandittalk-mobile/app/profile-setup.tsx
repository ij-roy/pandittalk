import axios from 'axios';
import { type Href, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScreen } from '../components/KeyboardAwareScreen';
import {
  ProfileFormSections,
  ProfileSaveButton,
  type ProfileFormValues,
} from '../components/profile/ProfileFormSections';
import { profileFormStyles as styles, TAB_BAR_CLEARANCE } from '../components/profile/profileFormStyles';
import { TabTopHeader } from '../components/TabTopHeader';
import { ScreenBackground } from '../components/ui/ScreenBackground';
import { GOLD } from '../constants/Colors';
import {
  getUserProfile,
  linkGoogleAccount,
  patchUserProfile,
  resolveMediaUrl,
  uploadProfileAvatar,
  type UpdateProfileDto,
} from '../lib/authApi';
import { isPendingAvatarUri } from '../lib/pendingAvatar';
import { userAfterProfileSave } from '../lib/profileStoreSync';
import { requestGoogleIdToken } from '../lib/googleAuth';
import {
  applyClockStringToDate,
  coerceProfileRecord,
  formatLocalYmd,
  formatTimeForApi,
  localDigitsFromPhone,
  mergeCoinBalanceIntoRecord,
  messageFromAxiosError,
  normalizeCityValue,
  normalizeGender,
  normalizeMaritalStatus,
  parseYmdToDate,
  readStr,
  type GenderOption,
  type MaritalStatusValue,
} from '../lib/profileUtils';
import {
  getMaxDateForMinimumAge,
  isAtLeastAge,
  MINIMUM_ACCOUNT_AGE,
  UNDERAGE_ACCOUNT_MESSAGE,
} from '../lib/age';
import { useAuthStore } from '../store/useAuthStore';

function profileToAuthUserRecord(r: Record<string, unknown>): Record<string, unknown> {
  return { ...r };
}

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHydrated = useAuthStore((s) => s.authHydrated);
  const hasProfile = useAuthStore((s) => s.hasProfile);
  const user = useAuthStore((s) => s.user);
  const setHasProfile = useAuthStore((s) => s.setHasProfile);
  const setUser = useAuthStore((s) => s.setUser);
  const updateProfileImageUrl = useAuthStore((s) => s.updateProfileImageUrl);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<GenderOption | null>(null);
  const [marital, setMarital] = useState<MaritalStatusValue | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    getMaxDateForMinimumAge(MINIMUM_ACCOUNT_AGE),
  );
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [birthPlace, setBirthPlace] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [googleLinking, setGoogleLinking] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [maritalOpen, setMaritalOpen] = useState(false);
  const [birthPlaceOpen, setBirthPlaceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (!authHydrated) return;
    if (!accessToken) {
      setProfileLoading(false);
      setProfileLoadError('You need to be signed in. Go back to login.');
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    setProfileLoadError(null);
    void (async () => {
      try {
        const res = await getUserProfile(accessToken);
        if (cancelled) return;
        const record = coerceProfileRecord(res.data);
        if (record) {
          setFirstName(readStr(record, 'firstName') ?? '');
          setLastName(readStr(record, 'lastName') ?? '');
          setEmail(readStr(record, 'email') ?? '');
          setGender(normalizeGender(readStr(record, 'gender')));
          setMarital(normalizeMaritalStatus(readStr(record, 'maritalStatus')));
          setBirthPlace(normalizeCityValue(readStr(record, 'placeOfBirth')));
          setAddress(readStr(record, 'currentAddress') ?? '');
          setCity(normalizeCityValue(readStr(record, 'city')));
          setPostalCode(readStr(record, 'postalCode') ?? '');
          setPhoneLocal(localDigitsFromPhone(readStr(record, 'phoneNumber')));

          const imageUrl = readStr(record, 'profileImageUrl');
          if (imageUrl) setAvatarUri(resolveMediaUrl(imageUrl));

          const dobStr = readStr(record, 'dob');
          const maxAdultDob = getMaxDateForMinimumAge(MINIMUM_ACCOUNT_AGE);
          const parsedDob = parseYmdToDate(dobStr);
          const dobDate =
            parsedDob && isAtLeastAge(parsedDob, MINIMUM_ACCOUNT_AGE)
              ? parsedDob
              : maxAdultDob;
          setSelectedDate(dobDate);
          const tob = readStr(record, 'timeOfBirth');
          setSelectedTime(applyClockStringToDate(dobDate, tob));

          setUser(profileToAuthUserRecord(mergeCoinBalanceIntoRecord(res.data, record)));
        }
      } catch (e) {
        if (cancelled) return;
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setProfileLoadError(null);
        } else {
          setProfileLoadError(messageFromAxiosError(e));
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, authHydrated, setUser]);

  const formValues: ProfileFormValues = {
    firstName,
    lastName,
    phoneLocal,
    email,
    gender,
    marital,
    selectedDate,
    selectedTime,
    birthPlace,
    address,
    city,
    postalCode,
  };

  const handleFormChange = useCallback(
    <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => {
      switch (key) {
        case 'firstName':
          setFirstName(value as string);
          break;
        case 'lastName':
          setLastName(value as string);
          break;
        case 'phoneLocal':
          setPhoneLocal(value as string);
          break;
        case 'email':
          setEmail(value as string);
          break;
        case 'gender':
          setGender(value as GenderOption | null);
          break;
        case 'marital':
          setMarital(value as MaritalStatusValue | null);
          break;
        case 'selectedDate':
          setSelectedDate(value as Date);
          break;
        case 'selectedTime':
          setSelectedTime(value as Date);
          break;
        case 'birthPlace':
          setBirthPlace(value as string | null);
          break;
        case 'address':
          setAddress(value as string);
          break;
        case 'city':
          setCity(value as string | null);
          break;
        case 'postalCode':
          setPostalCode(value as string);
          break;
        default:
          break;
      }
    },
    [],
  );

  const buildUpdatePayload = useCallback((): UpdateProfileDto => {
    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender: gender ?? undefined,
      dob: formatLocalYmd(selectedDate),
      timeOfBirth: formatTimeForApi(selectedTime),
      placeOfBirth: birthPlace ?? undefined,
      maritalStatus: marital ?? undefined,
      currentAddress: address.trim() || undefined,
      city: city ?? undefined,
      postalCode: postalCode.trim() || undefined,
    };
  }, [
    firstName,
    lastName,
    gender,
    selectedDate,
    selectedTime,
    birthPlace,
    marital,
    address,
    city,
    postalCode,
  ]);

  const handleAvatarChange = useCallback((uri: string | null) => {
    setAvatarUri(uri);
  }, []);

  const handleConnectGoogle = useCallback(async () => {
    if (!accessToken) {
      setSubmitError('You need to be signed in. Go back to login.');
      return;
    }
    setSubmitError(null);
    setGoogleLinking(true);
    try {
      const idToken = await requestGoogleIdToken();
      if (!idToken) return;
      await linkGoogleAccount(accessToken, idToken);
      const res = await getUserProfile(accessToken);
      const record = coerceProfileRecord(res.data);
      if (record) {
        setEmail(readStr(record, 'email') ?? '');
        setFirstName((prev) => prev || (readStr(record, 'firstName') ?? ''));
        setLastName((prev) => prev || (readStr(record, 'lastName') ?? ''));
        const imageUrl = readStr(record, 'profileImageUrl');
        if (imageUrl) setAvatarUri(resolveMediaUrl(imageUrl));
        setUser(profileToAuthUserRecord(mergeCoinBalanceIntoRecord(res.data, record)));
      }
    } catch (e) {
      setSubmitError(messageFromAxiosError(e));
    } finally {
      setGoogleLinking(false);
    }
  }, [accessToken, setUser]);

  const handleSaveProfile = useCallback(async () => {
    if (!accessToken) {
      setSubmitError('You need to be signed in. Go back to login.');
      return;
    }
    if (!firstName.trim()) {
      setSubmitError('Please enter your first name.');
      return;
    }
    if (!gender) {
      setSubmitError('Please select gender.');
      return;
    }
    if (!birthPlace) {
      setSubmitError('Please select place of birth.');
      return;
    }
    if (!isAtLeastAge(selectedDate, MINIMUM_ACCOUNT_AGE)) {
      setSubmitError(UNDERAGE_ACCOUNT_MESSAGE);
      return;
    }
    setSubmitError(null);
    setSubmitLoading(true);
    const previousUser =
      user && typeof user === 'object' ? (user as Record<string, unknown>) : null;
    let avatarUploaded = false;
    const storeServerProfile = (raw: unknown) => {
      const record = coerceProfileRecord(raw);
      const next = userAfterProfileSave(previousUser, record);
      if (!next) return;
      setUser(profileToAuthUserRecord(mergeCoinBalanceIntoRecord(raw, next)));
      const imageUrl = readStr(next, 'profileImageUrl');
      if (imageUrl) {
        const resolved = resolveMediaUrl(imageUrl);
        setAvatarUri(resolved);
        updateProfileImageUrl(resolved);
      }
    };
    try {
      if (isPendingAvatarUri(avatarUri) && avatarUri) {
        await uploadProfileAvatar(accessToken, avatarUri);
        avatarUploaded = true;
      }
      const patched = await patchUserProfile(accessToken, buildUpdatePayload());
      storeServerProfile(patched.data);
      if (!hasProfile) {
        setHasProfile(true);
        router.replace('/(tabs)/home' as unknown as Href);
      } else {
        Alert.alert('Saved', 'Your profile has been updated.', [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/profile' as unknown as Href);
              }
            },
          },
        ]);
      }
    } catch (e) {
      if (avatarUploaded) {
        try {
          const fresh = await getUserProfile(accessToken);
          storeServerProfile(fresh.data);
        } catch {
          // The form save failed and the refresh failed. Leave the previous account.
        }
      }
      setSubmitError(messageFromAxiosError(e));
    } finally {
      setSubmitLoading(false);
    }
  }, [
    accessToken,
    avatarUri,
    firstName,
    gender,
    birthPlace,
    selectedDate,
    buildUpdatePayload,
    user,
    hasProfile,
    setHasProfile,
    setUser,
    updateProfileImageUrl,
    router,
  ]);

  const formDisabled = profileLoading || submitLoading;
  const saveLabel = hasProfile ? 'Save changes' : 'Complete profile';

  return (
    <ScreenBackground>
      <TabTopHeader title="Edit Profile" showBack />

      <KeyboardAwareScreen
        headerOffset={insets.top + 56}
        bottomInset={insets.bottom + TAB_BAR_CLEARANCE}
        contentContainerStyle={styles.scrollInner}
      >
        {profileLoading || !authHydrated ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={styles.loadingHint}>Loading profile…</Text>
          </View>
        ) : (
          <>
            {profileLoadError ? (
              <Text style={styles.profileFetchError}>{profileLoadError}</Text>
            ) : null}

            <ProfileFormSections
              accessToken={accessToken}
              avatarUri={avatarUri}
              onAvatarChange={handleAvatarChange}
              values={formValues}
              onChange={handleFormChange}
              disabled={formDisabled}
              googleEmail={email.trim() || null}
              googleLinking={googleLinking}
              onConnectGoogle={handleConnectGoogle}
              birthPlaceOpen={birthPlaceOpen}
              cityOpen={cityOpen}
              maritalOpen={maritalOpen}
              showDatePicker={showDatePicker}
              showTimePicker={showTimePicker}
              onBirthPlaceOpen={setBirthPlaceOpen}
              onCityOpen={setCityOpen}
              onMaritalOpen={setMaritalOpen}
              onShowDatePicker={setShowDatePicker}
              onShowTimePicker={setShowTimePicker}
              maximumDate={getMaxDateForMinimumAge(MINIMUM_ACCOUNT_AGE)}
            />

            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
            <ProfileSaveButton
              title={saveLabel}
              loading={submitLoading}
              disabled={formDisabled}
              onPress={handleSaveProfile}
            />
          </>
        )}
      </KeyboardAwareScreen>
    </ScreenBackground>
  );
}
