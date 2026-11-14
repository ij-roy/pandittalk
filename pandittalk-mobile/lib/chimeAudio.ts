import {
  addRemoteVolumeListener,
  enableSessionMedia as nativeEnableSessionMedia,
  enterWaitingRoomMode as nativeEnterWaitingRoomMode,
  setMuted as nativeSetMuted,
  setSpeakerOn as nativeSetSpeakerOn,
  startMeeting,
  stopMeeting,
  type ChimeAttendee,
  type ChimeMeeting,
  type RemoteVolumePayload,
} from 'expo-pandit-chime';
import type { EventSubscription } from 'expo-modules-core';

import { ensureMicrophonePermission } from '@/lib/mediaPermissions';
import { stopCallForegroundWatch, watchCallForeground } from '@/lib/callForeground';

let remoteVolumeSubscription: EventSubscription | null = null;
let remoteVolumeHandler: ((payload: RemoteVolumePayload) => void) | null = null;
let sessionMediaActive = false;

export type { ChimeAttendee, ChimeMeeting, RemoteVolumePayload };

export const chimeAudio = {
  async startSession(meeting: ChimeMeeting, attendee: ChimeAttendee): Promise<void> {
    await this.stopSession();
    await ensureMicrophonePermission();

    if (remoteVolumeHandler) {
      remoteVolumeSubscription = addRemoteVolumeListener(remoteVolumeHandler);
    }

    await startMeeting(meeting, attendee);
    nativeSetSpeakerOn(true);
    this.enterWaitingRoomMode();
    watchCallForeground();
  },

  enterWaitingRoomMode(): void {
    sessionMediaActive = false;
    try {
      nativeEnterWaitingRoomMode();
      nativeSetMuted(true);
    } catch {
      // ignore if native module is unavailable during teardown
    }
  },

  enableSessionMedia(): void {
    sessionMediaActive = true;
    try {
      nativeEnableSessionMedia();
    } catch {
      // ignore if native module is unavailable during teardown
    }
  },

  isSessionMediaActive(): boolean {
    return sessionMediaActive;
  },

  async stopSession(): Promise<void> {
    stopCallForegroundWatch();
    remoteVolumeSubscription?.remove();
    remoteVolumeSubscription = null;
    sessionMediaActive = false;

    try {
      await stopMeeting();
    } catch {
      // ignore stop errors during cleanup
    }
  },

  setMuted(muted: boolean): boolean {
    try {
      return nativeSetMuted(muted);
    } catch {
      return false;
    }
  },

  setSpeakerOn(on: boolean): void {
    try {
      nativeSetSpeakerOn(on);
    } catch {
      // ignore speaker routing errors
    }
  },

  setRemoteVolumeHandler(
    handler: ((payload: RemoteVolumePayload) => void) | null,
  ): void {
    remoteVolumeHandler = handler;
    remoteVolumeSubscription?.remove();
    remoteVolumeSubscription = null;

    if (handler) {
      remoteVolumeSubscription = addRemoteVolumeListener((payload) => {
        if (sessionMediaActive) {
          handler(payload);
        }
      });
    }
  },
};
