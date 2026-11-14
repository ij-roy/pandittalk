export function shouldHoldSplashForAuth(hydrated: boolean): boolean {
  return !hydrated;
}

/** Login redirect waits until stored auth has been read. A token or guest stays in the app. */
export function authGateTarget(input: {
  hydrated: boolean;
  hasAccessToken: boolean;
  guest: boolean;
  inAuthFlow: boolean;
}): '/login' | null {
  if (!input.hydrated) return null;
  if (input.hasAccessToken || input.guest || input.inAuthFlow) return null;
  return '/login';
}
