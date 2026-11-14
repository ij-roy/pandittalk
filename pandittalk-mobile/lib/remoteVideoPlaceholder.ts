export type RemoteVideoPlaceholder = 'live' | 'camera-off' | 'reconnecting';

export function remoteVideoPlaceholder(
  hasRemoteTile: boolean,
  panditCameraOn: boolean | null,
): RemoteVideoPlaceholder {
  if (hasRemoteTile) return 'live';
  if (panditCameraOn === false) return 'camera-off';
  return 'reconnecting';
}
