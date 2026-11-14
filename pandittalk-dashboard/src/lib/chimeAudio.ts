import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
} from 'amazon-chime-sdk-js';

const logger = new ConsoleLogger('ChimeAudio', LogLevel.INFO);

export type ChimeMeeting = {
  MeetingId?: string;
  ExternalMeetingId?: string;
  MediaRegion?: string;
  MediaPlacement?: {
    AudioHostUrl?: string;
    AudioFallbackUrl?: string;
    SignalingUrl?: string;
    TurnControlUrl?: string;
  };
};

export type ChimeAttendee = {
  AttendeeId?: string;
  ExternalUserId?: string;
  JoinToken?: string;
};

export type MicActivityHandler = (active: boolean) => void;

let meetingSession: DefaultMeetingSession | null = null;
let audioElement: HTMLAudioElement | null = null;
let localAttendeeId: string | null = null;
let micActivityHandler: MicActivityHandler | null = null;
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

async function acquireMicrophoneStream(): Promise<MediaStream> {
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
      'Microphone permission denied. Allow microphone access for this site in your browser settings, then reload.',
    );
  }
}

function subscribeToLocalMicActivity(attendeeId: string): void {
  if (!meetingSession) return;

  meetingSession.audioVideo.realtimeSubscribeToVolumeIndicator(
    attendeeId,
    (_id, volume, muted) => {
      if (muted === true) {
        micActivityHandler?.(false);
        return;
      }
      if (volume !== null && volume > 0) {
        micActivityHandler?.(true);
      }
    },
  );
}

function unsubscribeFromLocalMicActivity(): void {
  if (!meetingSession || !localAttendeeId) return;

  meetingSession.audioVideo.realtimeUnsubscribeFromVolumeIndicator(localAttendeeId);
  localAttendeeId = null;
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

export const chimeAudio = {
  setMicActivityHandler(handler: MicActivityHandler | null): void {
    micActivityHandler = handler;
  },

  async startSession(
    meeting: ChimeMeeting,
    attendee: ChimeAttendee,
  ): Promise<void> {
    await this.stopSession();

    waitingRoomMode = false;
    userMuted = false;

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

    const micStream = await acquireMicrophoneStream();

    const inputDevices = await meetingSession.audioVideo.listAudioInputDevices();
    if (inputDevices.length === 0) {
      micStream.getTracks().forEach((track) => track.stop());
      throw new Error(
        'No microphone found. Connect a mic and allow browser access, then try again.',
      );
    }

    await meetingSession.audioVideo.startAudioInput(micStream);

    const el = getOrCreateAudioElement();
    meetingSession.audioVideo.bindAudioElement(el);

    await chooseDefaultAudioOutput();

    await meetingSession.audioVideo.start();

    this.enterWaitingRoomMode();

    const attendeeId = meetingSession.configuration.credentials?.attendeeId;
    if (attendeeId) {
      localAttendeeId = attendeeId;
      subscribeToLocalMicActivity(attendeeId);
    }
  },

  enterWaitingRoomMode(): void {
    waitingRoomMode = true;
    const el = getOrCreateAudioElement();
    el.volume = 0;
    if (meetingSession) {
      meetingSession.audioVideo.realtimeMuteLocalAudio();
    }
  },

  enableSessionMedia(): void {
    waitingRoomMode = false;
    const el = getOrCreateAudioElement();
    el.volume = 1;
    if (meetingSession && !userMuted) {
      meetingSession.audioVideo.realtimeUnmuteLocalAudio();
    }
  },

  isSessionMediaActive(): boolean {
    return !waitingRoomMode;
  },

  async stopSession(): Promise<void> {
    unsubscribeFromLocalMicActivity();

    if (!meetingSession) return;

    try {
      await meetingSession.audioVideo.stopAudioInput();
    } catch {
      // ignore stop errors during cleanup
    }

    try {
      meetingSession.audioVideo.stop();
    } catch {
      // ignore stop errors during cleanup
    }

    meetingSession = null;
    waitingRoomMode = false;
    userMuted = false;
    micActivityHandler?.(false);
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
};
