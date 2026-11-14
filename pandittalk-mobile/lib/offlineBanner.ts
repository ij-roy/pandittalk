export type ConnectivitySnapshot = {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
};

/** Show the banner only when the device reports no link or no reachable internet. */
export function shouldShowOfflineBanner(state: ConnectivitySnapshot | null | undefined): boolean {
  if (!state) return false;
  if (state.isConnected === false) return true;
  if (state.isInternetReachable === false) return true;
  return false;
}
