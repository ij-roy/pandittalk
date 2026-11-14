import { isAxiosError } from 'axios';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GOLD, GREY_LABEL, SESSION_BG, STAR_EMPTY, TEXT_PRIMARY_DARK, WHITE } from '@/constants/Colors';
import { submitReview } from '@/lib/bookingApi';
import { canSendRating } from '@/lib/postCallRating';
import { markStoreRatingAsked, requestStoreRating, hasAskedStoreRating } from '@/lib/storeRating';
import { shouldAskStoreRating, storeRatingPrompt } from '@/lib/storeRatingPrompt';

type Props = {
  bookingId: string;
};

function ratingError(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: unknown } | undefined;
    const message = data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return 'Could not send the rating. Try again.';
}

export function PostCallRating({ bookingId }: Props) {
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [offerStore, setOfferStore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storePrompt = storeRatingPrompt(Platform.OS);

  const send = () => {
    if (!canSendRating(rating, submitting)) return;
    setSubmitting(true);
    setError(null);
    void submitReview(bookingId, rating)
      .then(async () => {
        setSent(true);
        const asked = await hasAskedStoreRating();
        setOfferStore(shouldAskStoreRating(rating, asked));
      })
      .catch((err: unknown) => setError(ratingError(err)))
      .finally(() => setSubmitting(false));
  };

  if (sent) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.thanks}>Thanks for the rating.</Text>
        {offerStore ? (
          <>
            <Text style={styles.storePrompt}>{storePrompt.body}</Text>
            <TouchableOpacity
              onPress={() => {
                setOfferStore(false);
                void requestStoreRating();
              }}
              accessibilityRole="button"
              accessibilityLabel={storePrompt.action}
            >
              <Text style={styles.storeAction}>{storePrompt.action}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setOfferStore(false);
                void markStoreRatingAsked();
              }}
              accessibilityRole="button"
              accessibilityLabel="Not now"
            >
              <Text style={styles.storeLater}>Not now</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.prompt}>Rate this session</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} star${star === 1 ? '' : 's'}`}
            style={styles.starHit}
          >
            <Text style={[styles.star, star <= rating ? styles.starOn : styles.starOff]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.send, !canSendRating(rating, submitting) && styles.sendOff]}
        onPress={send}
        disabled={!canSendRating(rating, submitting)}
        accessibilityRole="button"
        accessibilityLabel="Send rating"
      >
        {submitting ? (
          <ActivityIndicator color={WHITE} />
        ) : (
          <Text style={styles.sendText}>Send rating</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  prompt: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  starHit: {
    paddingHorizontal: 4,
  },
  star: {
    fontSize: 32,
  },
  starOn: {
    color: GOLD,
  },
  starOff: {
    color: STAR_EMPTY,
  },
  error: {
    color: GREY_LABEL,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  send: {
    backgroundColor: SESSION_BG,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 140,
    alignItems: 'center',
  },
  sendOff: {
    opacity: 0.45,
  },
  sendText: {
    color: WHITE,
    fontWeight: '700',
  },
  thanks: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  storePrompt: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  storeAction: {
    marginTop: 8,
    color: GOLD,
    fontWeight: '700',
    fontSize: 15,
  },
  storeLater: {
    marginTop: 6,
    color: GREY_LABEL,
    fontSize: 13,
    fontWeight: '600',
  },
});
