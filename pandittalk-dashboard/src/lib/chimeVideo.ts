import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
  type AudioVideoObserver,
} from 'amazon-chime-sdk-js';

import type { ChimeAttendee, ChimeMeeting } from './chimeAudio';

const logger = new ConsoleLogger('ChimeVideo', LogLevel.INFO);

export type VideoElements = {
  localVideo: HTMLVideoElement;
  remoteVideo: HTMLVideoElement;
};

let meetingSession: DefaultMeetingSession | null = null;
let audioElement: HTMLAudioElement | null = null;
let localVideoElement: HTMLVideoElement | null = null;
let remoteVideoElement: HTMLVideoElement | null = null;
let audioStream: MediaStream | null = null;
let videoStream: MediaStream | null = null;
let observer: AudioVideoObserver | null = null;
let localTileId: number | null = null;
let remoteTileId: number | null = null;
let pendingRemoteTileId: number | null = null;
let cameraEnabled = true;
let waitingRoomMode = false;
let userMuted = false;

function getOrCreateAudioElement(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.style.display = 'none';
    document.body.appendChild(audioElement);
  }
  return audioElement;
}

function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

async function acquireAudioStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone access is not supported in this browser.');
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  } catch {
    throw new Error(
      'Microphone permission denied. Allow access for this site in your browser settings, then reload.',
    );
  }
}

async function acquireVideoStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera access is not supported in this browser.');
  }

  try {
    return await navigator.mediaDevices.getUserMedia({ video: true });
  } catch {
    throw new Error(
      'Camera permission denied. Allow access for this site in your browser settings, then reload.',
    );
  }
}

async function chooseDefaultAudioOutput(): Promise<void> {
  if (!meetingSession) return;

  const outputs = await meetingSession.audioVideo.listAudioOutputDevices();
  if (outputs.length === 0) return;

  const preferred =
    outputs.find(
      (device) =>
        device.deviceId === 'default' ||
        /default|speaker|communications/i.test(device.label),
    ) ?? outputs[0];

  await meetingSession.audioVideo.chooseAudioOutput(preferred.deviceId);
}

function bindLocalVideoTile(tileId: number): void {
  if (!meetingSession || !localVideoElement) return;
  localTileId = tileId;
  meetingSession.audioVideo.bindVideoElement(tileId, localVideoElement);
}

function restartLocalVideoTile(): void {
  if (!meetingSession || !cameraEnabled || !localVideoElement) return;
  const tileId = meetingSession.audioVideo.startLocalVideoTile();
  bindLocalVideoTile(tileId);
}

function bindRemoteTile(tileId: number): void {
  if (!meetingSession || !remoteVideoElement) return;
  remoteTileId = tileId;
  meetingSession.audioVideo.bindVideoElement(tileId, remoteVideoElement);
}

function clearRemoteVideo(): void {
  remoteTileId = null;
  pendingRemoteTileId = null;
  if (remoteVideoElement) {
    remoteVideoElement.srcObject = null;
  }
}

function createObserver(): AudioVideoObserver {
  return {
    videoTileDidUpdate: (tileState) => {
      if (!meetingSession || !tileState.tileId) return;

      if (tileState.localTile) {
        if (localVideoElement && cameraEnabled) {
          bindLocalVideoTile(tileState.tileId);
        }
        return;
      }

      if (!tileState.isContent && tileState.boundAttendeeId) {
        if (waitingRoomMode) {
          pendingRemoteTileId = tileState.tileId;
          return;
        }
        bindRemoteTile(tileState.tileId);
      }
    },
    videoTileWasRemoved: (tileId) => {
      if (tileId === remoteTileId || tileId === pendingRemoteTileId) {
        clearRemoteVideo();
      }
      if (tileId === localTileId) {
        localTileId = null;
        if (cameraEnabled) {
          restartLocalVideoTile();
        }
      }
    },
  };
}

export const chimeVideo = {
  async startSession(
    meeting: ChimeMeeting,
    attendee: ChimeAttendee,
    elements: VideoElements,
  ): Promise<void> {
    await this.stopSession();

    localVideoElement = elements.localVideo;
    remoteVideoElement = elements.remoteVideo;
    cameraEnabled = true;
    waitingRoomMode = false;
    userMuted = false;
    pendingRemoteTileId = null;

    const configuration = new MeetingSessionConfiguration(
      { Meeting: meeting },
      { Attendee: attendee },
    );

    const deviceController = new DefaultDeviceController(logger);
    meetingSession = new DefaultMeetingSession(
      configuration,
      logger,
      deviceController,
    );

    audioStream = await acquireAudioStream();
    videoStream = await acquireVideoStream();

    const inputDevices = await meetingSession.audioVideo.listAudioInputDevices();
    if (inputDevices.length === 0) {
      stopMediaStream(audioStream);
      stopMediaStream(videoStream);
      audioStream = null;
      videoStream = null;
      throw new Error(
        'No microphone found. Connect a mic and allow browser access, then try again.',
      );
    }

    await meetingSession.audioVideo.startAudioInput(audioStream);
    await meetingSession.audioVideo.startVideoInput(videoStream);

    const el = getOrCreateAudioElement();
    meetingSession.audioVideo.bindAudioElement(el);

    const tileId = meetingSession.audioVideo.startLocalVideoTile();
    bindLocalVideoTile(tileId);

    await chooseDefaultAudioOutput();

    observer = createObserver();
    meetingSession.audioVideo.addObserver(observer);

    await meetingSession.audioVideo.start();

    this.enterWaitingRoomMode();
  },

  enterWaitingRoomMode(): void {
    waitingRoomMode = true;
    const el = getOrCreateAudioElement();
    el.volume = 0;
    if (meetingSession) {
      meetingSession.audioVideo.realtimeMuteLocalAudio();
    }
    if (remoteTileId !== null && remoteVideoElement) {
      remoteVideoElement.srcObject = null;
      remoteTileId = null;
    }
  },

  enableSessionMedia(): void {
    waitingRoomMode = false;
    const el = getOrCreateAudioElement();
    el.volume = 1;
    if (meetingSession && !userMuted) {
      meetingSession.audioVideo.realtimeUnmuteLocalAudio();
    }
    if (pendingRemoteTileId !== null) {
      bindRemoteTile(pendingRemoteTileId);
      pendingRemoteTileId = null;
    }
  },

  isSessionMediaActive(): boolean {
    return !waitingRoomMode;
  },

  async stopSession(): Promise<void> {
    if (meetingSession && observer) {
      meetingSession.audioVideo.removeObserver(observer);
      observer = null;
    }

    if (meetingSession) {
      try {
        meetingSession.audioVideo.stopLocalVideoTile();
      } catch {
        // ignore stop errors during cleanup
      }

      try {
        await meetingSession.audioVideo.stopAudioInput();
      } catch {
        // ignore stop errors during cleanup
      }

      try {
        await meetingSession.audioVideo.stopVideoInput();
      } catch {
        // ignore stop errors during cleanup
      }

      try {
        meetingSession.audioVideo.stop();
      } catch {
        // ignore stop errors during cleanup
      }
    }

    stopMediaStream(audioStream);
    stopMediaStream(videoStream);
    audioStream = null;
    videoStream = null;

    clearRemoteVideo();
    localTileId = null;
    meetingSession = null;
    localVideoElement = null;
    remoteVideoElement = null;
    cameraEnabled = true;
    waitingRoomMode = false;
    userMuted = false;
  },

  setMuted(muted: boolean): void {
    userMuted = muted;
    if (!meetingSession) return;
    if (muted) {
      meetingSession.audioVideo.realtimeMuteLocalAudio();
    } else {
      meetingSession.audioVideo.realtimeUnmuteLocalAudio();
    }
  },

  setCameraEnabled(enabled: boolean): void {
    if (!meetingSession) return;

    cameraEnabled = enabled;

    if (enabled) {
      restartLocalVideoTile();
    } else {
      meetingSession.audioVideo.stopLocalVideoTile();
      localTileId = null;
      if (localVideoElement) {
        localVideoElement.srcObject = null;
      }
    }
  },

  rebindVideoElements(localVideo: HTMLVideoElement, remoteVideo: HTMLVideoElement): void {
    localVideoElement = localVideo;
    remoteVideoElement = remoteVideo;
    if (localTileId !== null) {
      bindLocalVideoTile(localTileId);
    }
    if (remoteTileId !== null && !waitingRoomMode) {
      bindRemoteTile(remoteTileId);
    }
  },

  hasRemoteVideo(): boolean {
    return remoteTileId !== null;
  },
};
