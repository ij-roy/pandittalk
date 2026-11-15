import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  BG,
  GOLD,
  GREY_LABEL,
  TEXT_PRIMARY_DARK,
  WHITE,
} from '@/constants/Colors';
import { fetchExpertById, type ExpertEntity } from '@/lib/expertsApi';
import { presenceLabel } from '@/lib/presenceCopy';

type Props = {
  visible: boolean;
  panditId: string;
  panditName: string;
  onClose: () => void;
};

/** Profile summary over the live chat. Closing it returns to the same session. */
export function ChatPanditCard({ visible, panditId, panditName, onClose }: Props) {
  const [expert, setExpert] = useState<ExpertEntity | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !panditId) return;
    let cancelled = false;
    setLoading(true);
    void fetchExpertById(panditId)
      .then((data) => {
        if (!cancelled) setExpert(data);
      })
      .catch(() => {
        if (!cancelled) setExpert(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, panditId]);

  const name = expert?.name || panditName;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close pandit profile">
        <Pressable style={styles.card} onPress={() => {}} accessibilityViewIsModal>
          <Text style={styles.kicker}>Still in your session</Text>
          <Text style={styles.name}>{name}</Text>
          {loading ? <ActivityIndicator color={GOLD} style={styles.loader} /> : null}
          {expert ? (
            <>
              <Text style={styles.line}>{expert.specialty}</Text>
              <Text style={styles.line}>{expert.languagesDisplay}</Text>
              <Text style={styles.line}>{expert.experienceLabel}</Text>
              <Text style={styles.line}>
                {expert.totalReviews > 0
                  ? `${expert.ratingDisplay.toFixed(1)} · ${expert.reviewCountLabel}`
                  : expert.reviewCountLabel}
              </Text>
              <Text style={styles.line}>{presenceLabel(expert.isOnline)}</Text>
            </>
          ) : !loading ? (
            <Text style={styles.line}>Profile details are unavailable right now.</Text>
          ) : null}
          <Pressable
            style={styles.close}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Back to chat"
          >
            <Text style={styles.closeText}>Back to chat</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  loader: {
    marginTop: 16,
  },
  line: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    color: TEXT_PRIMARY_DARK,
  },
  close: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: GREY_LABEL,
  },
});
