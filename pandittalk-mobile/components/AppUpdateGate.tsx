import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GOLD, SCRIM_BLACK, TEXT_PRIMARY_DARK, WHITE, WARM_IVORY } from '@/constants/Colors';
import {
  decideAppUpdate,
  dismissSoftUpdate,
  type AppUpdateDecision,
} from '@/lib/appUpdateConfig';

export function AppUpdateGate() {
  const [decision, setDecision] = useState<AppUpdateDecision>({ kind: 'none' });
  const [checking, setChecking] = useState(false);

  const runCheck = useCallback(async () => {
    setChecking(true);
    try {
      const next = await decideAppUpdate();
      setDecision(next);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void runCheck();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runCheck();
    });
    return () => sub.remove();
  }, [runCheck]);

  const visible = decision.kind === 'force' || decision.kind === 'soft';
  const forced = decision.kind === 'force';

  const onUpdate = () => {
    if (decision.kind === 'none') return;
    void Linking.openURL(decision.storeUrl).catch(() => undefined);
  };

  const onLater = () => {
    if (decision.kind !== 'soft') return;
    void dismissSoftUpdate(decision.latestVersion).then(() =>
      setDecision({ kind: 'none' }),
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {
      if (!forced) onLater();
    }}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {forced ? 'Update required' : 'Update available'}
          </Text>
          <Text style={styles.body}>
            {decision.kind === 'none' ? '' : decision.message}
          </Text>
          {checking ? <ActivityIndicator color={GOLD} style={styles.spinner} /> : null}
          <Pressable style={styles.primaryBtn} onPress={onUpdate}>
            <Text style={styles.primaryText}>Update</Text>
          </Pressable>
          {!forced ? (
            <Pressable style={styles.secondaryBtn} onPress={onLater}>
              <Text style={styles.secondaryText}>Later</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: SCRIM_BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: WARM_IVORY,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: TEXT_PRIMARY_DARK,
  },
  spinner: { marginVertical: 4 },
  primaryBtn: {
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: {
    color: TEXT_PRIMARY_DARK,
    fontSize: 15,
    fontWeight: '500',
  },
});
