import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PremiumCard, SectionRule } from '@/components/premium-auth-ui';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { MandalaBackdrop } from '@/components/ui/MandalaBackdrop';
import { PremiumButton } from '@/components/ui/PremiumButton';
import {
  GOLD,
  GOLD_RING_BORDER,
  GREY_LABEL,
  IMAGE_PLACEHOLDER,
  MUTED_GREY,
  TEXT_PRIMARY_DARK,
  WARM_IVORY,
  WHITE,
} from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { resolveMediaUrl } from '@/lib/authApi';
import {
  computeProfileProgress,
  type ProfileProgress,
} from '@/lib/profileProgress';
import { profileFieldValue, PROFILE_ADD_LABEL } from '@/lib/profileEmptyField';
import {
  formatDateLabel,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  parseYmdToDate,
  readStr,
} from '@/lib/profileUtils';

const AVATAR_SIZE = 116;

type Props = {
  user: Record<string, unknown> | null;
  incompleteHint?: boolean;
};

function genderLabel(raw: string | null): string | null {
  const value = profileFieldValue(raw);
  if (!value) return null;
  return GENDER_OPTIONS.find((o) => o.value === value.toLowerCase())?.label ?? value;
}

function maritalLabel(raw: string | null): string | null {
  const value = profileFieldValue(raw);
  if (!value) return null;
  return (
    MARITAL_STATUS_OPTIONS.find((o) => o.value === value.toLowerCase())?.label ?? value
  );
}

function formatDob(raw: string | null): string | null {
  const value = profileFieldValue(raw);
  if (!value) return null;
  const date = parseYmdToDate(value);
  return date ? formatDateLabel(date) : value;
}

function formatTob(raw: string | null): string | null {
  const value = profileFieldValue(raw);
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const hours24 = Number(match[1]);
  const minutes = match[2];
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${`${hours12}`.padStart(2, '0')}:${minutes} ${suffix}`;
}

function progressFromUser(user: Record<string, unknown> | null): ProfileProgress {
  const nested =
    user && typeof user.profileProgress === 'object' ? user.profileProgress : null;
  if (
    nested &&
    typeof nested === 'object' &&
    typeof (nested as ProfileProgress).percent === 'number'
  ) {
    return nested as ProfileProgress;
  }
  return computeProfileProgress({
    phoneNumber: typeof user?.phoneNumber === 'string' ? user.phoneNumber : null,
    firstName: typeof user?.firstName === 'string' ? user.firstName : null,
    lastName: typeof user?.lastName === 'string' ? user.lastName : null,
    name: typeof user?.name === 'string' ? user.name : null,
    email: typeof user?.email === 'string' ? user.email : null,
    profileImageUrl:
      typeof user?.profileImageUrl === 'string' ? user.profileImageUrl : null,
    gender: typeof user?.gender === 'string' ? user.gender : null,
    dob: typeof user?.dob === 'string' ? user.dob : null,
    timeOfBirth: typeof user?.timeOfBirth === 'string' ? user.timeOfBirth : null,
    placeOfBirth: typeof user?.placeOfBirth === 'string' ? user.placeOfBirth : null,
  });
}

function InfoRow({
  label,
  value,
  hint,
  last,
  onAdd,
}: {
  label: string;
  value: string | null;
  hint?: string;
  last?: boolean;
  onAdd?: () => void;
}) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      {value ? (
        <Text style={styles.infoValue}>{value}</Text>
      ) : (
        <TouchableOpacity
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={`${PROFILE_ADD_LABEL} ${label}`}
        >
          <Text style={styles.addLink}>{PROFILE_ADD_LABEL}</Text>
        </TouchableOpacity>
      )}
      {hint ? <Text style={styles.infoHint}>{hint}</Text> : null}
    </View>
  );
}

export function ProfileViewContent({ user, incompleteHint = true }: Props) {
  const router = useRouter();

  const firstName = user ? (readStr(user, 'firstName') ?? '') : '';
  const lastName = user ? (readStr(user, 'lastName') ?? '') : '';
  const fullName = `${firstName} ${lastName}`.trim();
  const phone = user ? readStr(user, 'phoneNumber') : undefined;
  const email = user ? readStr(user, 'email') : undefined;
  const gender = user ? (readStr(user, 'gender') ?? null) : null;
  const marital = user ? (readStr(user, 'maritalStatus') ?? null) : null;
  const dob = user ? (readStr(user, 'dob') ?? null) : null;
  const tob = user ? (readStr(user, 'timeOfBirth') ?? null) : null;
  const birthPlace = user ? readStr(user, 'placeOfBirth') : undefined;
  const address = user ? readStr(user, 'currentAddress') : undefined;
  const city = user ? readStr(user, 'city') : undefined;
  const postal = user ? readStr(user, 'postalCode') : undefined;
  const imageUrl = user ? readStr(user, 'profileImageUrl') : undefined;
  const avatarUri = imageUrl ? resolveMediaUrl(imageUrl) : null;

  const progress = useMemo(() => progressFromUser(user), [user]);
  const showIncomplete = incompleteHint && progress.percent < 100;

  const openEdit = () => {
    router.push('/profile-setup' as Href);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <MandalaBackdrop size={240} opacity={0.06} style={styles.motif} />
        <View style={styles.avatarRing}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color={WHITE} />
            </View>
          )}
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {fullName || 'Your profile'}
        </Text>
        <Text style={styles.phone} numberOfLines={1}>
          {phone || 'Add your phone in edit'}
        </Text>
      </View>

      {showIncomplete ? (
        <AnimatedPressable
          style={styles.progressCard}
          onPress={openEdit}
          accessibilityRole="button"
          accessibilityLabel="Complete your profile"
        >
          <View style={styles.progressHead}>
            <Text style={styles.progressKicker}>Profile {progress.percent}% complete</Text>
            <Ionicons name="chevron-forward" size={16} color={GOLD} />
          </View>
          <Text style={styles.progressHint}>
            A fuller profile helps personalize guidance. Tap to continue.
          </Text>
        </AnimatedPressable>
      ) : null}

      <PremiumCard>
        <View style={styles.sectionGap}>
          <SectionRule label="Personal" />
        </View>
        <InfoRow label="Full name" value={profileFieldValue(fullName)} onAdd={openEdit} />
        <InfoRow label="Gender" value={genderLabel(gender)} onAdd={openEdit} />
        <InfoRow label="Phone" value={profileFieldValue(phone)} onAdd={openEdit} />
        <InfoRow
          label="Email"
          value={email ? email : 'Not connected'}
          hint={
            email
              ? 'From Google or Apple Sign-In — not editable here.'
              : 'Connect Google in Edit profile to add email.'
          }
        />
        <InfoRow label="Marital status" value={maritalLabel(marital)} onAdd={openEdit} last />
      </PremiumCard>

      <PremiumCard>
        <View style={styles.sectionGap}>
          <SectionRule label="Birth & address" />
        </View>
        <InfoRow label="Date of birth" value={formatDob(dob)} onAdd={openEdit} />
        <InfoRow label="Time of birth" value={formatTob(tob)} onAdd={openEdit} />
        <InfoRow label="Place of birth" value={profileFieldValue(birthPlace)} onAdd={openEdit} />
        <InfoRow label="Address" value={profileFieldValue(address)} onAdd={openEdit} />
        <InfoRow label="City" value={profileFieldValue(city)} onAdd={openEdit} />
        <InfoRow label="Postal code" value={profileFieldValue(postal)} onAdd={openEdit} last />
      </PremiumCard>

      <PremiumButton
        title="Edit profile"
        onPress={openEdit}
        style={styles.editBtn}
        uppercase={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    paddingBottom: 8,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    position: 'relative',
  },
  motif: {
    position: 'absolute',
    top: -20,
  },
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: IMAGE_PLACEHOLDER,
    borderWidth: 3,
    borderColor: GOLD_RING_BORDER,
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WARM_IVORY,
  },
  name: {
    ...Typography.h2,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  phone: {
    ...Typography.bodySm,
    color: MUTED_GREY,
    marginTop: 4,
  },
  progressCard: {
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: GOLD,
    backgroundColor: WARM_IVORY,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  progressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressKicker: {
    ...Typography.caption,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    letterSpacing: 0.2,
  },
  progressHint: {
    ...Typography.body,
    fontSize: 13,
    color: GREY_LABEL,
    lineHeight: 18,
  },
  sectionGap: {
    marginBottom: 4,
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  infoLabel: {
    ...Typography.caption,
    color: MUTED_GREY,
    marginBottom: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  infoValue: {
    ...Typography.body,
    fontSize: 16,
    color: TEXT_PRIMARY_DARK,
    fontWeight: '500',
  },
  addLink: {
    ...Typography.body,
    fontSize: 16,
    color: GOLD,
    fontWeight: '600',
  },
  infoHint: {
    ...Typography.caption,
    color: GREY_LABEL,
    marginTop: 6,
    lineHeight: 16,
  },
  editBtn: {
    marginTop: 4,
  },
});
