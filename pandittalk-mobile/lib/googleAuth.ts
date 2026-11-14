import { Platform } from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

let configured = false;

function configureGoogleSignIn(): void {
  if (configured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  GoogleSignin.configure({
    webClientId: webClientId || undefined,
    iosClientId: iosClientId || undefined,
    offlineAccess: false,
  });
  configured = true;
}

function missingClientIdMessage(): string | null {
  const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!web) {
    return 'Google Sign-In is not configured in this build. Use mobile number and OTP instead.';
  }
  if (Platform.OS === 'ios') {
    const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
    if (!ios) {
      return 'Google Sign-In is not configured for iPhone in this build. Use mobile number and OTP, or Sign in with Apple.';
    }
  }
  return null;
}

/** Map Google SDK / Play Services failures to user-facing copy (#264). */
export function messageFromGoogleSignInError(err: unknown): string | null {
  if (!err) return null;

  if (isErrorWithCode(err)) {
    const code = String(err.code);
    if (code === statusCodes.SIGN_IN_CANCELLED || code === 'SIGN_IN_CANCELLED') {
      return null; // caller treats as cancel
    }
    if (code === statusCodes.IN_PROGRESS || code === 'IN_PROGRESS') {
      return 'Google Sign-In is already in progress. Wait a moment and try again.';
    }
    if (
      code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE ||
      code === 'PLAY_SERVICES_NOT_AVAILABLE'
    ) {
      return 'Google Play Services is missing or needs an update on this device. Update Play Services, or sign in with mobile OTP instead.';
    }
    if (code === statusCodes.SIGN_IN_REQUIRED || code === 'SIGN_IN_REQUIRED') {
      return 'Google needs you to sign in again. Try Connect Google once more.';
    }
    if (code === 'DEVELOPER_ERROR') {
      return 'Google Sign-In is misconfigured for this app install (signing key / client ID). Use mobile OTP instead, or reinstall a production build.';
    }
    if (code === 'INTERNAL_ERROR' || code === 'NETWORK_ERROR') {
      return code === 'NETWORK_ERROR'
        ? 'Network error during Google Sign-In. Check your connection and try again.'
        : 'Google Sign-In hit an internal error on this device. Try again, or use mobile OTP.';
    }
    if (code === statusCodes.NULL_PRESENTER || code === 'NULL_PRESENTER') {
      return 'Could not open the Google Sign-In screen. Leave this page and try again.';
    }
    const msg = typeof err.message === 'string' ? err.message.trim() : '';
    if (msg) return msg;
    return `Google Sign-In failed (${code}). Try mobile OTP instead.`;
  }

  if (err instanceof Error) {
    const msg = err.message.trim();
    if (!msg) return 'Google Sign-In failed. Try mobile OTP instead.';
    // Already humanized in this module
    if (/Google|Play Services|OTP|Sign-In/i.test(msg)) return msg;
    return msg;
  }

  const code = (err as { code?: string } | null)?.code;
  if (typeof code === 'string' && code) {
    return messageFromGoogleSignInError({ code, message: '' });
  }
  return null;
}

/** Returns a Google ID token, or null if the user cancelled. */
export async function requestGoogleIdToken(): Promise<string | null> {
  const configError = missingClientIdMessage();
  if (configError) {
    throw new Error(configError);
  }

  configureGoogleSignIn();

  if (Platform.OS === 'android') {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    } catch (err) {
      const mapped = messageFromGoogleSignInError(err);
      throw new Error(
        mapped ??
          'Google Play Services is missing or needs an update. Use mobile OTP instead.',
      );
    }
  }

  try {
    await GoogleSignin.signOut();
  } catch {
    // No previous session is fine.
  }

  try {
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return null;
    }
    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error('Google did not return an identity token. Try again or use mobile OTP.');
    }
    return idToken;
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    const mapped = messageFromGoogleSignInError(err);
    if (mapped) throw new Error(mapped);
    throw err;
  }
}
