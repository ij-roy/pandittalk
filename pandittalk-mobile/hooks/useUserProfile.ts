import { useEffect, useMemo } from 'react';

import { getUserProfile, resolveMediaUrl } from '@/lib/authApi';
import { coerceProfileRecord, mergeCoinBalanceIntoRecord, readStr } from '@/lib/profileUtils';
import { useAuthStore } from '@/store/useAuthStore';

export function useUserProfile() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const updateProfileImageUrl = useAuthStore((s) => s.updateProfileImageUrl);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await getUserProfile(accessToken);
        if (cancelled) return;
        const record = coerceProfileRecord(res.data);
        if (record) {
          setUser(mergeCoinBalanceIntoRecord(res.data, record));
        }
      } catch {
        // Keep existing store user on failure.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, setUser]);

  const firstName = useMemo(() => {
    if (user && typeof user.firstName === 'string') {
      return user.firstName.trim();
    }
    return '';
  }, [user]);

  const greetingTitle = useMemo(
    () => `Hi, ${firstName || 'there'}`,
    [firstName],
  );

  const avatarUri = useMemo(() => {
    if (!user || typeof user !== 'object') return null;
    const profileImageUrl = readStr(user as Record<string, unknown>, 'profileImageUrl');
    return profileImageUrl ? resolveMediaUrl(profileImageUrl) : null;
  }, [user]);

  return {
    firstName,
    greetingTitle,
    user,
    avatarUri,
    updateProfileImageUrl,
  };
}

/** Mount once in tab layout to hydrate profile for all tabs. */
export function ProfileHydrator() {
  useUserProfile();
  return null;
}
