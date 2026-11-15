import type { JoinAudioSessionResponse } from './api';
import type { WebRtcSignal } from './chatSocket';

export type MicActivityHandler = (active: boolean) => void;

let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;
let audioElement: HTMLAudioElement | null = null;
let signalSender: ((signal: WebRtcSignal) => void) | null = null;
let micActivityHandler: MicActivityHandler | null = null;
let waitingRoomMode = false;
let userMuted = false;
let offerSent = false;

function getOrCreateAudioElement(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.autoplay = true;
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
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch {
    throw new Error(
      'Microphone permission denied. Allow microphone access for this site in your browser settings, then reload.',
    );
  }
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function createPeerConnection(config: JoinAudioSessionResponse): RTCPeerConnection {
  if (peerConnection) return peerConnection;
  if (!localStream) throw new Error('Microphone is not ready.');

  const connection = new RTCPeerConnection({ iceServers: config.iceServers });
  peerConnection = connection;
  localStream.getTracks().forEach((track) => connection.addTrack(track, localStream!));
  connection.onicecandidate = (event) => {
    if (event.candidate) {
      signalSender?.({
        type: 'ice-candidate',
        candidate: event.candidate.toJSON() as Record<string, unknown>,
      });
    }
  };
  connection.ontrack = (event) => {
    remoteStream = event.streams[0] ?? remoteStream;
    const element = getOrCreateAudioElement();
    element.srcObject = remoteStream;
    element.play().catch(() => undefined);
  };
  connection.onconnectionstatechange = () => {
    if (connection.connectionState === 'failed') {
      connection.restartIce();
    }
  };
  return connection;
}

async function createOffer(config: JoinAudioSessionResponse): Promise<void> {
  const connection = createPeerConnection(config);
  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  if (offer.sdp) signalSender?.({ type: 'offer', sdp: offer.sdp });
}

export const webrtcAudio = {
  setMicActivityHandler(handler: MicActivityHandler | null): void {
    micActivityHandler = handler;
    if (!handler) return;
    // The media track itself is the source of truth; the UI only needs a safe
    // connected signal here, while WebRTC handles the actual audio transport.
    handler(Boolean(localStream && !userMuted));
  },

  setSignalSender(sender: ((signal: WebRtcSignal) => void) | null): void {
    signalSender = sender;
  },

  async startSession(config: JoinAudioSessionResponse): Promise<void> {
    void config;
    await this.stopSession();
    localStream = await acquireMicrophoneStream();
    waitingRoomMode = false;
    userMuted = false;
    offerSent = false;
    getOrCreateAudioElement().volume = 1;
  },

  async handlePeerReady(config: JoinAudioSessionResponse, initiator: boolean): Promise<void> {
    createPeerConnection(config);
    if (initiator && !offerSent && peerConnection?.signalingState === 'stable') {
      offerSent = true;
      try {
        await createOffer(config);
      } catch (error) {
        offerSent = false;
        throw error;
      }
    }
  },

  async handleSignal(config: JoinAudioSessionResponse, signal: WebRtcSignal): Promise<void> {
    const connection = createPeerConnection(config);
    if (signal.type === 'ice-candidate') {
      if (signal.candidate) await connection.addIceCandidate(signal.candidate as RTCIceCandidateInit);
      return;
    }
    if (signal.type === 'answer' && connection.signalingState !== 'have-local-offer') return;
    if (signal.type === 'offer' && connection.signalingState !== 'stable') return;
    await connection.setRemoteDescription({ type: signal.type, sdp: signal.sdp });
    if (signal.type === 'offer') {
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      if (answer.sdp) signalSender?.({ type: 'answer', sdp: answer.sdp });
    }
  },

  enterWaitingRoomMode(): void {
    waitingRoomMode = true;
    getOrCreateAudioElement().volume = 0;
    localStream?.getAudioTracks().forEach((track) => (track.enabled = false));
  },

  enableSessionMedia(): void {
    waitingRoomMode = false;
    getOrCreateAudioElement().volume = 1;
    if (!userMuted) localStream?.getAudioTracks().forEach((track) => (track.enabled = true));
    micActivityHandler?.(Boolean(localStream && !userMuted));
  },

  isSessionMediaActive(): boolean {
    return !waitingRoomMode;
  },

  async stopSession(): Promise<void> {
    peerConnection?.close();
    peerConnection = null;
    stopStream(localStream);
    localStream = null;
    remoteStream = null;
    if (audioElement) audioElement.srcObject = null;
    waitingRoomMode = false;
    userMuted = false;
    offerSent = false;
    micActivityHandler?.(false);
  },

  setMuted(muted: boolean): void {
    userMuted = muted;
    localStream?.getAudioTracks().forEach((track) => (track.enabled = !muted && !waitingRoomMode));
    micActivityHandler?.(Boolean(localStream && !muted && !waitingRoomMode));
  },
};
