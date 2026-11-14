export type PalmUploadFailureKind = 'network' | 'too-large' | 'other';

/** Base64 length. Two palms under this stay as prepared. */
export const PALM_IMAGE_BUDGET = 900_000;

export function palmNeedsShrink(base64: string, budget = PALM_IMAGE_BUDGET): boolean {
  return base64.length > budget;
}

export function palmUploadFailureKind(input: {
  offline: boolean;
  status?: number | null;
}): PalmUploadFailureKind {
  if (input.offline) return 'network';
  if (input.status === 413) return 'too-large';
  if (input.status === 408 || input.status === 502 || input.status === 503 || input.status === 504) {
    return 'network';
  }
  return 'other';
}

export function palmUploadFailureCopy(kind: PalmUploadFailureKind): {
  title: string;
  message: string;
} {
  if (kind === 'network') {
    return {
      title: 'Upload paused',
      message: 'The connection dropped. Your palm photos are still here. Try again to send them.',
    };
  }
  if (kind === 'too-large') {
    return {
      title: 'Photos were too large',
      message: 'Your palm photos are still here. Try again and a smaller copy is sent.',
    };
  }
  return {
    title: 'Palm reading',
    message: 'The reading did not finish. Your palm photos are still here.',
  };
}
