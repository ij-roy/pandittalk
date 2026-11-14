import { Ionicons } from '@expo/vector-icons';
import { BackChevron } from '@/components/BackChevron';
import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAvoidingContainer } from '@/components/KeyboardAwareScreen';

import {
  BLACK,
  DANGER_RED,
  GOLD,
  GREY_LABEL,
  HEADER_RULE_GREY,
  STAR_EMPTY,
  TEXT_PRIMARY_DARK,
  WHITE,
  WARM_IVORY,
} from '@/constants/Colors';
import { submitReview } from '@/lib/bookingApi';
import { hasAskedStoreRating, markStoreRatingAsked, requestStoreRating } from '@/lib/storeRating';
import { shouldAskStoreRating, storeRatingPrompt } from '@/lib/storeRatingPrompt';
import { REVIEW_RULES, reviewCanSubmit, reviewStarWord } from '@/lib/reviewRules';
import { reviewWindowNote } from '@/lib/reviewWindow';

const MAX_COMMENT = 300;

function paramString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

function messageFromError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: unknown; error?: unknown } | undefined;
    const m = data?.message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.map(String).join(', ');
    if (typeof data?.error === 'string') return data.error;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Could not submit review.';
}

type StarSelectorProps = {
  value: number;
  onChange: (rating: number) => void;
};

function StarSelector({ value, onChange }: StarSelectorProps) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            activeOpacity={0.75}
            accessibilityLabel={`Rate ${star} stars`}
            style={styles.starHit}
          >
            <Text style={[styles.starGlyph, filled ? styles.starFilled : styles.starEmpty]}>★</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function BookingReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const raw = useLocalSearchParams<{ bookingId: string; panditName: string }>();
  const bookingId = paramString(raw.bookingId);
  const panditName = paramString(raw.panditName) || 'Pandit';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thankYou, setThankYou] = useState(false);
  const [offerStoreRating, setOfferStoreRating] = useState(false);
  const storePrompt = storeRatingPrompt(Platform.OS);

  const onSubmit = useCallback(async () => {
    if (!bookingId) {
      setError('Missing booking id.');
      return;
    }
    if (rating < 1) {
      setError('Please select a star rating.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitReview(bookingId, rating, comment.trim() || undefined);
      const asked = await hasAskedStoreRating();
      if (shouldAskStoreRating(rating, asked)) {
        setOfferStoreRating(true);
        setThankYou(true);
        return;
      }
      setThankYou(true);
      setTimeout(() => {
        router.replace('/bookings/history');
      }, 1400);
    } catch (e) {
      setError(messageFromError(e));
    } finally {
      setSubmitting(false);
    }
  }, [bookingId, comment, rating, router]);

  if (!bookingId) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackChevron color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.fallbackText}>Invalid review link.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingContainer
      style={styles.screen}
      headerOffset={Math.max(insets.top, 12) + 48}
    >
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackChevron color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate & Review</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 24 }]}
      >
        {thankYou ? (
          <View style={styles.thankYouBlock}>
            <Ionicons name="checkmark-circle" size={56} color={GOLD} />
            <Text style={styles.thankYouTitle}>Thank you!</Text>
            <Text style={styles.thankYouSubtitle}>Your review has been submitted.</Text>
            {offerStoreRating ? (
              <>
                <Text style={styles.storePrompt}>{storePrompt.body}</Text>
                <TouchableOpacity
                  style={styles.storeAction}
                  onPress={() => {
                    void requestStoreRating().finally(() => {
                      router.replace('/bookings/history');
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={storePrompt.action}
                >
                  <Text style={styles.storeActionText}>{storePrompt.action}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    void markStoreRatingAsked().finally(() => {
                      router.replace('/bookings/history');
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Not now"
                >
                  <Text style={styles.storeLater}>Not now</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        ) : (
          <>
            <Text style={styles.panditHeader}>{panditName}</Text>
            <Text style={styles.sectionLabel}>How was your session?</Text>
            <Text style={styles.rules}>{REVIEW_RULES}</Text>
            <Text style={styles.rules}>{reviewWindowNote(null)}</Text>

            <StarSelector value={rating} onChange={(r) => {
              setRating(r);
              if (error) setError(null);
            }} />
            <Text style={styles.starWord}>
              {reviewStarWord(rating) ?? 'No star chosen yet'}
            </Text>

            <Text style={styles.sectionLabel}>Comment (optional)</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={(t) => setComment(t.slice(0, MAX_COMMENT))}
              placeholder="Share your experience…"
              placeholderTextColor={GREY_LABEL}
              multiline
              maxLength={MAX_COMMENT}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {comment.length}/{MAX_COMMENT}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, (!reviewCanSubmit(rating) || submitting) && styles.submitBtnDisabled]}
              onPress={() => void onSubmit()}
              disabled={!reviewCanSubmit(rating) || submitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={reviewCanSubmit(rating) ? 'Submit review' : 'Choose a star to submit'}
            >
              {submitting ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {reviewCanSubmit(rating) ? 'Submit review' : 'Choose a star'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WARM_IVORY,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: WARM_IVORY,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HEADER_RULE_GREY,
  },
  backHit: {
    minWidth: 72,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: GOLD,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  headerSpacer: {
    minWidth: 72,
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  panditHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: BLACK,
    textAlign: 'center',
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GREY_LABEL,
    marginBottom: 12,
  },
  rules: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_PRIMARY_DARK,
    marginTop: -4,
    marginBottom: 12,
  },
  starWord: {
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 28,
  },
  starHit: {
    padding: 4,
  },
  starGlyph: {
    fontSize: 40,
    lineHeight: 44,
  },
  starFilled: {
    color: GOLD,
  },
  starEmpty: {
    color: STAR_EMPTY,
  },
  commentInput: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    backgroundColor: WHITE,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 6,
    marginBottom: 20,
    fontSize: 12,
    fontWeight: '500',
    color: GREY_LABEL,
  },
  errorText: {
    color: DANGER_RED,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.75,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
  thankYouBlock: {
    alignItems: 'center',
    paddingTop: 48,
  },
  thankYouTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
    color: BLACK,
  },
  thankYouSubtitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '500',
    color: GREY_LABEL,
    textAlign: 'center',
  },
  storePrompt: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  storeAction: {
    marginTop: 16,
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  storeActionText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 15,
  },
  storeLater: {
    marginTop: 12,
    color: GREY_LABEL,
    fontSize: 14,
    fontWeight: '600',
  },
  fallbackText: {
    marginTop: 40,
    textAlign: 'center',
    color: GREY_LABEL,
    fontSize: 15,
    paddingHorizontal: 24,
  },
});
