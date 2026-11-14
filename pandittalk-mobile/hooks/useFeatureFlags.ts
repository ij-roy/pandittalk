import { useEffect, useState } from 'react';

import {
  DEFAULT_FEATURE_FLAGS,
  getFeatureFlags,
  refreshFeatureFlags,
  subscribeFeatureFlags,
  type FeatureFlags,
} from '@/lib/featureFlags';

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags() ?? DEFAULT_FEATURE_FLAGS);

  useEffect(() => {
    const unsubscribe = subscribeFeatureFlags(setFlags);
    void refreshFeatureFlags();
    return unsubscribe;
  }, []);

  return flags;
}
