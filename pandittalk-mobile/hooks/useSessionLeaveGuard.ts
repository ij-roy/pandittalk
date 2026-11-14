import { useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, BackHandler } from 'react-native';

type Options = {
  /** When false, navigation is not intercepted (e.g. session already ended). */
  enabled: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  /** Called after the user confirms leave, before the navigation action runs. */
  onConfirmLeave: () => void | Promise<void>;
};

/**
 * Intercepts Android hardware back + iOS swipe-back / stack pop so active
 * sessions always confirm before leaving (#61).
 */
export function useSessionLeaveGuard({
  enabled,
  title,
  message,
  confirmLabel = 'Leave',
  onConfirmLeave,
}: Options): { allowNextRemove: () => void } {
  const navigation = useNavigation();
  const allowRef = useRef(false);
  const onConfirmRef = useRef(onConfirmLeave);
  onConfirmRef.current = onConfirmLeave;

  const allowNextRemove = () => {
    allowRef.current = true;
  };

  useEffect(() => {
    if (!enabled) return;

    const prompt = (onConfirmed: () => void) => {
      Alert.alert(title, message, [
        { text: 'Stay', style: 'cancel' },
        {
          text: confirmLabel,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await onConfirmRef.current();
              onConfirmed();
            })();
          },
        },
      ]);
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (allowRef.current) return false;
      prompt(() => {
        allowRef.current = true;
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      });
      return true;
    });

    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (allowRef.current) return;
      e.preventDefault();
      prompt(() => {
        allowRef.current = true;
        navigation.dispatch(e.data.action);
      });
    });

    return () => {
      backSub.remove();
      unsub();
    };
  }, [enabled, title, message, confirmLabel, navigation]);

  return { allowNextRemove };
}
