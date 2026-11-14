import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GOLD, SESSION_RED, WHITE } from '@/constants/Colors';
import { addLocalSignalListener, type LocalSignalLevel } from 'expo-pandit-chime';

type ShownLevel = LocalSignalLevel | 'unknown';

function signalCopy(level: LocalSignalLevel): { title: string; detail: string | null } {
  if (level === 'high') {
    return { title: 'Your connection is good', detail: null };
  }
  if (level === 'low') {
    return {
      title: 'Your connection is weak',
      detail: 'Audio may cut out because of your network, not the pandit.',
    };
  }
  return {
    title: 'Your connection dropped',
    detail: 'This is your network. The pandit is not the cause.',
  };
}

/** Chime's local signal, shown only while the call media is up. */
export function CallConnectionBanner({ active }: { active: boolean }) {
  const [level, setLevel] = useState<ShownLevel>('unknown');

  useEffect(() => {
    if (!active) {
      setLevel('unknown');
      return;
    }
    let subscription: { remove: () => void } | null = null;
    try {
      subscription = addLocalSignalListener((payload) => {
        if (payload.level === 'high' || payload.level === 'low' || payload.level === 'none') {
          setLevel(payload.level);
        }
      });
    } catch {
      setLevel('unknown');
    }
    return () => subscription?.remove();
  }, [active]);

  if (!active || level === 'unknown') return null;

  const copy = signalCopy(level);
  const weak = level !== 'high';

  return (
    <View
      style={[styles.banner, weak ? styles.bannerWeak : styles.bannerGood]}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.title, weak ? styles.titleWeak : styles.titleGood]}>{copy.title}</Text>
      {copy.detail ? <Text style={styles.detail}>{copy.detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'stretch',
  },
  bannerGood: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bannerWeak: {
    backgroundColor: 'rgba(214, 69, 69, 0.16)',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleGood: {
    color: GOLD,
  },
  titleWeak: {
    color: SESSION_RED,
  },
  detail: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: WHITE,
    textAlign: 'center',
  },
});
