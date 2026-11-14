import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import {
  requestCameraPermission as requestNativeCameraPermission,
  requestMicrophonePermission as requestNativeMicrophonePermission,
} from 'expo-pandit-chime';

export type MediaPermissionKind = 'microphone' | 'camera';

export class MediaPermissionDeniedError extends Error {
  readonly kind: MediaPermissionKind;

  constructor(kind: MediaPermissionKind) {
    super(
      kind === 'microphone'
        ? 'Microphone permission is required for calls'
        : 'Camera permission is required for video calls',
    );
    this.name = 'MediaPermissionDeniedError';
    this.kind = kind;
  }
}

export function isMediaPermissionDeniedError(
  err: unknown,
): err is MediaPermissionDeniedError {
  return err instanceof MediaPermissionDeniedError;
}

/** Prompt with deep link to system Settings after a hard deny. */
export function alertOpenSettingsForPermission(
  kind: MediaPermissionKind,
  onDismiss?: () => void,
): void {
  const title =
    kind === 'microphone' ? 'Microphone access needed' : 'Camera access needed';
  const message =
    kind === 'microphone'
      ? 'Enable microphone access in Settings to continue your audio or video consultation.'
      : 'Enable camera access in Settings to continue your video consultation.';

  Alert.alert(title, message, [
    { text: 'Not now', style: 'cancel', onPress: onDismiss },
    {
      text: 'Open Settings',
      onPress: () => {
        void Linking.openSettings().catch(() => undefined);
        onDismiss?.();
      },
    },
  ]);
}

export async function ensureMicrophonePermission(): Promise<void> {
  if (Platform.OS === 'android') {
    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    if (alreadyGranted) return;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone access',
        message: 'PanditTalk needs your microphone for live consultations.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new MediaPermissionDeniedError('microphone');
    }
    return;
  }

  if (Platform.OS === 'ios') {
    const status = await requestNativeMicrophonePermission();
    if (status !== 'granted') {
      throw new MediaPermissionDeniedError('microphone');
    }
  }
}

export async function ensureCameraPermission(): Promise<void> {
  if (Platform.OS === 'android') {
    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );
    if (alreadyGranted) return;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera access',
        message: 'PanditTalk needs your camera for video consultations.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new MediaPermissionDeniedError('camera');
    }
    return;
  }

  if (Platform.OS === 'ios') {
    const status = await requestNativeCameraPermission();
    if (status !== 'granted') {
      throw new MediaPermissionDeniedError('camera');
    }
  }
}
