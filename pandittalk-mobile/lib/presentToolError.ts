import { Alert } from 'react-native';

import { isOfflineSubmitError, messageFromToolError, NO_INTERNET_MESSAGE } from '@/lib/toolSubmitError';

export function presentToolFailure(err: unknown, retry: () => void, title = 'Error') {
  if (isOfflineSubmitError(err)) {
    Alert.alert('No internet', NO_INTERNET_MESSAGE, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retry', onPress: retry },
    ]);
    return;
  }
  Alert.alert(title, messageFromToolError(err));
}
