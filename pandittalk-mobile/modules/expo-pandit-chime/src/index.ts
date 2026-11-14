import { LegacyEventEmitter, type EventSubscription, UnavailabilityError } from 'expo-modules-core';

import ExpoPanditChime from './ExpoPanditChimeModule';
import type { ChimeAttendee, ChimeMeeting, VideoTilePayload } from './ExpoPanditChime.types';

export type { ChimeAttendee, ChimeMeeting, ChimeMediaPlacement, VideoTilePayload } from './ExpoPanditChime.types';
export { VideoSurface } from './ExpoPanditChimeVideoView';
export type { VideoSurfaceProps } from './ExpoPanditChimeVideoView';

export type RemoteVolumePayload = {
  attendeeId: string;
  volume: number;
  muted: boolean;
};

const emitter = new LegacyEventEmitter(ExpoPanditChime);

function assertModule(): void {
  if (!ExpoPanditChime?.startMeeting) {
    throw new UnavailabilityError('ExpoPanditChime', 'startMeeting');
  }
}

export async function startMeeting(
  meeting: ChimeMeeting,
  attendee: ChimeAttendee,
): Promise<void> {
  assertModule();
  await ExpoPanditChime.startMeeting(meeting, attendee);
}

export async function startVideoMeeting(
  meeting: ChimeMeeting,
  attendee: ChimeAttendee,
): Promise<void> {
  assertModule();
  await ExpoPanditChime.startVideoMeeting(meeting, attendee);
}

export async function stopMeeting(): Promise<void> {
  assertModule();
  await ExpoPanditChime.stopMeeting();
}

/** False when the native meeting rejects the mute change. Undefined (older binary) is treated as success. */
export function setMuted(muted: boolean): boolean {
  assertModule();
  const result = ExpoPanditChime.setMuted(muted) as boolean | undefined;
  return result !== false;
}

export function setSpeakerOn(on: boolean): void {
  assertModule();
  ExpoPanditChime.setSpeakerOn(on);
}

export function setCameraOn(on: boolean): void {
  assertModule();
  ExpoPanditChime.setCameraOn(on);
}

export function flipCamera(): void {
  assertModule();
  ExpoPanditChime.flipCamera();
}

export function enterWaitingRoomMode(): void {
  assertModule();
  ExpoPanditChime.enterWaitingRoomMode();
}

export function enableSessionMedia(): void {
  assertModule();
  ExpoPanditChime.enableSessionMedia();
}

export function resumeForegroundMedia(): void {
  if (!ExpoPanditChime?.resumeForegroundMedia) return;
  ExpoPanditChime.resumeForegroundMedia();
}

export function setRemoteAudioEnabled(enabled: boolean): void {
  assertModule();
  ExpoPanditChime.setRemoteAudioEnabled(enabled);
}

export async function requestMicrophonePermission(): Promise<'granted' | 'denied'> {
  if (!ExpoPanditChime?.requestMicrophonePermission) {
    return 'granted';
  }
  const result = await ExpoPanditChime.requestMicrophonePermission();
  return result === 'granted' ? 'granted' : 'denied';
}

export async function requestCameraPermission(): Promise<'granted' | 'denied'> {
  if (!ExpoPanditChime?.requestCameraPermission) {
    return 'granted';
  }
  const result = await ExpoPanditChime.requestCameraPermission();
  return result === 'granted' ? 'granted' : 'denied';
}

export function addRemoteVolumeListener(
  listener: (payload: RemoteVolumePayload) => void,
): EventSubscription {
  return emitter.addListener<RemoteVolumePayload>(
    'onRemoteVolumeChanged',
    listener,
  );
}

export type LocalSignalLevel = 'high' | 'low' | 'none';

export type LocalSignalPayload = {
  level: LocalSignalLevel;
};

export function addLocalSignalListener(
  listener: (payload: LocalSignalPayload) => void,
): EventSubscription {
  assertModule();
  return emitter.addListener<LocalSignalPayload>('onLocalSignalChanged', listener);
}

export function addVideoTileAddedListener(
  listener: (payload: VideoTilePayload) => void,
): EventSubscription {
  return emitter.addListener<VideoTilePayload>('onVideoTileAdded', listener);
}

export function addVideoTileRemovedListener(
  listener: (payload: VideoTilePayload) => void,
): EventSubscription {
  return emitter.addListener<VideoTilePayload>('onVideoTileRemoved', listener);
}

export function addErrorListener(
  listener: (payload: { message: string }) => void,
): EventSubscription {
  return emitter.addListener<{ message: string }>('onError', listener);
}
