import { type Href, router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PremiumCard } from '@/components/premium-auth-ui';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import {
  GOLD,
  GOLD_BORDER,
  HIGHLIGHT_IVORY,
  MUTED_GREY,
  TEXT_PRIMARY_DARK,
  WARM_WHITE,
} from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import {
  computeProfileProgress,
  nextIncompleteItem,
  type ProfileProgress,
} from '@/lib/profileProgress';
import { progressFillDurationMs } from '@/lib/reduceMotion';
import { useAuthStore } from '@/store/useAuthStore';

function progressFromUser(user: Record<string, unknown> | null): ProfileProgress {
  const nested = user && typeof user.profileProgress === 'object' ? user.profileProgress : null;
  if (nested && typeof nested === 'object' && typeof (nested as ProfileProgress).percent === 'number') {
    return nested as ProfileProgress;
  }
  return computeProfileProgress({
    phoneNumber: typeof user?.phoneNumber === 'string' ? user.phoneNumber : null,
    firstName: typeof user?.firstName === 'string' ? user.firstName : null,
    lastName: typeof user?.lastName === 'string' ? user.lastName : null,
    name: typeof user?.name === 'string' ? user.name : null,
    email: typeof user?.email === 'string' ? user.email : null,
    profileImageUrl: typeof user?.profileImageUrl === 'string' ? user.profileImageUrl : null,
    gender: typeof user?.gender === 'string' ? user.gender : null,
    dob: typeof user?.dob === 'string' ? user.dob : null,
    timeOfBirth: typeof user?.timeOfBirth === 'string' ? user.timeOfBirth : null,
    placeOfBirth: typeof user?.placeOfBirth === 'string' ? user.placeOfBirth : null,
  });
}

export function ProfileProgressCard() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user) as Record<string, unknown> | null;
  const progress = useMemo(() => progressFromUser(user), [user]);
  const [trackWidth, setTrackWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const animatedFillWidth = useSharedValue(0);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    animatedFillWidth.value = withTiming(trackWidth * (progress.percent / 100), {
      duration: progressFillDurationMs(reduceMotion),
    });
  }, [animatedFillWidth, progress.percent, reduceMotion, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({ width: animatedFillWidth.value }));

  if (!accessToken || progress.percent >= 100) {
    return null;
  }

  const next = nextIncompleteItem(progress);
  const cta =
    next?.id === 'email'
      ? 'Connect Google'
      : next?.id === 'birth' || next?.id === 'gender' || next?.id === 'name' || next?.id === 'photo'
        ? 'Continue profile'
        : 'Continue profile';

  return (
    <PremiumCard>
      <View style={styles.headRow}>
        <Text style={styles.kicker}>Your profile</Text>
        <Text style={styles.percent}>{progress.percent}%</Text>
      </View>
      <View
        style={styles.track}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <Text style={styles.hint}>
        {next
          ? `Already underway — next, add ${next.label.toLowerCase()}.`
          : 'Your profile is taking shape.'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipRail}
      >
        {progress.items.map((item) => (
          <View key={item.id} style={[styles.chip, item.complete && styles.chipDone]}>
            <Text style={[styles.chipText, item.complete && styles.chipTextDone]}>
              {item.complete ? '✓  ' : ''}
              {item.label}
            </Text>
          </View>
        ))}
      </ScrollView>
      <AnimatedPressable
        onPress={() => router.push('/profile-setup' as Href)}
        style={styles.cta}
        accessibilityRole="button"
        accessibilityLabel={cta}
      >
        <Text style={styles.ctaText}>{cta}</Text>
      </AnimatedPressable>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  kicker: {
    ...Typography.caption,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  percent: {
    ...Typography.h3,
    color: GOLD,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: HIGHLIGHT_IVORY,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  hint: {
    ...Typography.bodySm,
    color: MUTED_GREY,
    marginTop: 12,
  },
  chipRail: {
    marginHorizontal: -20,
    marginTop: 14,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingRight: 32,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GOLD_BORDER,
    backgroundColor: WARM_WHITE,
  },
  chipDone: {
    backgroundColor: HIGHLIGHT_IVORY,
  },
  chipText: {
    ...Typography.caption,
    color: MUTED_GREY,
  },
  chipTextDone: {
    color: TEXT_PRIMARY_DARK,
  },
  cta: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  ctaText: {
    ...Typography.button,
    color: GOLD,
    letterSpacing: 0.2,
    fontSize: 13,
  },
});
