import {
  addErrorListener,
  addVideoTileAddedListener,
  addVideoTileRemovedListener,
  enableSessionMedia as nativeEnableSessionMedia,
  enterWaitingRoomMode as nativeEnterWaitingRoomMode,
  flipCamera as nativeFlipCamera,
  setCameraOn as nativeSetCameraOn,
  setMuted as nativeSetMuted,
  setSpeakerOn as nativeSetSpeakerOn,
  startVideoMeeting,
  stopMeeting,
  VideoSurface,
  type ChimeAttendee,
  type ChimeMeeting,
  type VideoTilePayload,
} from 'expo-pandit-chime';
import type { EventSubscription } from 'expo-modules-core';

import {
  ensureCameraPermission,
  ensureMicrophonePermission,
} from '@/lib/mediaPermissions';
import { stopCallForegroundWatch, watchCallForeground } from '@/lib/callForeground';

export type { ChimeAttendee, ChimeMeeting, VideoTilePayload };
export { VideoSurface };

let tileAddedSubscription: EventSubscription | null = null;
let tileRemovedSubscription: EventSubscription | null = null;
let errorSubscription: EventSubscription | null = null;
let tilesChangedHandler: ((tiles: VideoTilesState) => void) | null = null;
let errorHandler: ((message: string) => void) | null = null;

let localTileId: number | null = null;
let remoteTileId: number | null = null;
let cameraOn = true;
let sessionMediaActive = false;

export type VideoTilesState = {
  localTileId: number | null;
  remoteTileId: number | null;
};

function emitTilesChanged(): void {
  tilesChangedHandler?.({
    localTileId,
    remoteTileId,
  });
}

function handleTileAdded(payload: VideoTilePayload): void {
  if (payload.isContent) return;
  if (payload.isLocal) {
    localTileId = payload.tileId;
  } else {
    remoteTileId = payload.tileId;
  }
  emitTilesChanged();
}

function handleTileRemoved(payload: VideoTilePayload): void {
  if (payload.isContent) return;
  if (payload.isLocal && localTileId === payload.tileId) {
    localTileId = null;
  } else if (!payload.isLocal && remoteTileId === payload.tileId) {
    remoteTileId = null;
  }
  emitTilesChanged();
}

function clearTileListeners(): void {
  tileAddedSubscription?.remove();
  tileRemovedSubscription?.remove();
  errorSubscription?.remove();
  tileAddedSubscription = null;
  tileRemovedSubscription = null;
  errorSubscription = null;
}

function resetTileState(): void {
  localTileId = null;
  remoteTileId = null;
  cameraOn = true;
  sessionMediaActive = false;
}

export const chimeVideo = {
  getTiles(): VideoTilesState {
    return { localTileId, remoteTileId };
  },

  setTilesChangedHandler(handler: ((tiles: VideoTilesState) => void) | null): void {
    tilesChangedHandler = handler;
    if (handler) {
      handler({ localTileId, remoteTileId });
    }
  },

  setErrorHandler(handler: ((message: string) => void) | null): void {
    errorHandler = handler;
  },

  async startVideoSession(meeting: ChimeMeeting, attendee: ChimeAttendee): Promise<void> {
    await this.stopVideoSession();
    await ensureMicrophonePermission();
    await ensureCameraPermission();

    resetTileState();
    clearTileListeners();

    tileAddedSubscription = addVideoTileAddedListener(handleTileAdded);
    tileRemovedSubscription = addVideoTileRemovedListener(handleTileRemoved);
    errorSubscription = addErrorListener((payload) => {
      const message = payload.message?.trim() || 'Chime video session error';
      errorHandler?.(message);
    });

    await startVideoMeeting(meeting, attendee);
    nativeSetSpeakerOn(true);
    cameraOn = true;
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

  async stopVideoSession(): Promise<void> {
    stopCallForegroundWatch();
    clearTileListeners();
    resetTileState();

    try {
      await stopMeeting();
    } catch {
      // ignore stop errors during cleanup
    }
  },

  toggleCamera(): boolean {
    const next = !cameraOn;
    cameraOn = next;
    try {
      nativeSetCameraOn(next);
    } catch {
      // ignore if native module is unavailable during teardown
    }
    return next;
  },

  isCameraOn(): boolean {
    return cameraOn;
  },

  flipCamera(): void {
    try {
      nativeFlipCamera();
    } catch {
      // ignore if native module is unavailable during teardown
    }
  },

  toggleMute(muted: boolean): boolean {
    try {
      return nativeSetMuted(muted);
    } catch {
      return false;
    }
  },
};
