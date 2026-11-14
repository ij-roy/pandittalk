import { ForbiddenException } from '@nestjs/common';

export type ClientPlatform = 'ios' | 'android' | 'web' | 'unknown';

export function parseClientPlatform(
  header?: string | string[],
): ClientPlatform {
  const raw = Array.isArray(header) ? header[0] : header;
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'ios' || value === 'android' || value === 'web') {
    return value;
  }
  return 'unknown';
}

/** Option C: block paid digital tool unlocks on iOS App Store builds. */
export function assertDigitalToolPurchaseAllowed(
  platform: ClientPlatform,
): void {
  if (platform === 'ios') {
    throw new ForbiddenException(
      'Paid digital reports are not available for purchase in the iOS app. Please use free tools or book a live chat consultation.',
    );
  }
}

/** Gate native A/V until Chime iOS ships. */
export function assertAvBookingAllowed(platform: ClientPlatform): void {
  if (platform === 'ios') {
    throw new ForbiddenException(
      'Audio and video sessions are not available on iPhone yet. Please use live chat.',
    );
  }
}
