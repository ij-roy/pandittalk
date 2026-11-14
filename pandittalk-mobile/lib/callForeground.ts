import { AppState } from 'react-native';

import { resumeForegroundMedia } from 'expo-pandit-chime';

import { shouldResumeCall } from '@/lib/callResume';
import { chatSocket } from '@/lib/chatSocket';

let subscription: { remove: () => void } | null = null;
let previous = AppState.currentState;

export function watchCallForeground(): void {
  subscription?.remove();
  previous = AppState.currentState;
  subscription = AppState.addEventListener('change', (next) => {
    if (shouldResumeCall(previous, next)) {
      try {
        resumeForegroundMedia();
      } catch {
        // An older dev client does not have the native resume yet.
      }
      chatSocket.resumeFromForeground();
    }
    previous = next;
  });
}

export function stopCallForegroundWatch(): void {
  subscription?.remove();
  subscription = null;
}
