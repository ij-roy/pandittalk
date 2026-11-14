import { Platform } from 'react-native';

/**
 * App Store Option C policy for iOS:
 * - Razorpay / coins may fund live 1:1 consultations (chat, audio and video).
 * - Paid digital tools/reports must not be sold or coin-unlocked on iOS.
 */
export function isIosClient(): boolean {
  return Platform.OS === 'ios';
}

/** Coins may be purchased/spent for live pandit consultations on iOS. */
export function canUseConsultationCoins(): boolean {
  return true;
}

/** Paid kundli / reports / tool unlocks — blocked on iOS (need IAP otherwise). */
export function canPurchaseDigitalTools(): boolean {
  return !isIosClient();
}

/**
 * Audio and video consultations use the native Chime bridge on iOS and Android.
 */
export function canBookAvSessions(): boolean {
  return true;
}

export function canJoinAvSessions(): boolean {
  return true;
}

export const IOS_DIGITAL_TOOLS_UNAVAILABLE_TITLE = 'Not available on iPhone';

export const IOS_DIGITAL_TOOLS_UNAVAILABLE_MESSAGE =
  'Paid digital reports are not available for purchase in the iPhone app. You can still use free tools or book a live chat with a pandit.';

export const IOS_AV_UNAVAILABLE_TITLE = 'Calls coming soon on iPhone';

export const IOS_AV_UNAVAILABLE_MESSAGE =
  'Audio and video calls are not available on iPhone yet. Please use Chat Now for a live consultation.';

export const CLIENT_PLATFORM_HEADER = 'X-Client-Platform';

export function clientPlatformValue(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}
