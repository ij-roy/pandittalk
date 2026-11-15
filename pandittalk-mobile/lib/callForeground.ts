import { AppState } from 'react-native';

import { shouldResumeCall } from '@/lib/callResume';
import { chatSocket } from '@/lib/chatSocket';

let subscription: { remove: () => void } | null = null;
let previous = AppState.currentState;

export function watchCallForeground(): void {
  subscription?.remove();
  previous = AppState.currentState;
  subscription = AppState.addEventListener('change', (next) => {
    if (shouldResumeCall(previous, next)) {
      chatSocket.resumeFromForeground();
    }
    previous = next;
  });
}

export function stopCallForegroundWatch(): void {
  subscription?.remove();
  subscription = null;
}
