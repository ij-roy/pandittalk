import type { JoinAudioSessionResponse } from './api';
import type { WebRtcSignal } from './chatSocket';

export type VideoElements = { localVideo: HTMLVideoElement; remoteVideo: HTMLVideoElement };

let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;
let localVideoElement: HTMLVideoElement | null = null;
let remoteVideoElement: HTMLVideoElement | null = null;
let signalSender: ((signal: WebRtcSignal) => void) | null = null;
let cameraEnabled = true;
let waitingRoomMode = false;
let userMuted = false;
let offerSent = false;

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

async function acquireMediaStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera and microphone are not supported in this browser.');
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: true,
    });
  } catch {
    throw new Error('Camera or microphone permission denied. Allow access for this site, then reload.');
  }
}

function bind(element: HTMLVideoElement | null, stream: MediaStream | null): void {
  if (!element) return;
  element.srcObject = stream;
  if (stream) element.play().catch(() => undefined);
}

function createPeerConnection(config: JoinAudioSessionResponse): RTCPeerConnection {
  if (peerConnection) return peerConnection;
  if (!localStream) throw new Error('Camera and microphone are not ready.');
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
    if (!waitingRoomMode) bind(remoteVideoElement, remoteStream);
  };
  connection.onconnectionstatechange = () => {
    if (connection.connectionState === 'failed') connection.restartIce();
  };
  return connection;
}

async function createOffer(config: JoinAudioSessionResponse): Promise<void> {
  const connection = createPeerConnection(config);
  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  if (offer.sdp) signalSender?.({ type: 'offer', sdp: offer.sdp });
}

export const webrtcVideo = {
  async startSession(config: JoinAudioSessionResponse, elements: VideoElements): Promise<void> {
    void config;
    await this.stopSession();
    localVideoElement = elements.localVideo;
    remoteVideoElement = elements.remoteVideo;
    localStream = await acquireMediaStream();
    bind(localVideoElement, localStream);
    cameraEnabled = true;
    waitingRoomMode = false;
    userMuted = false;
    offerSent = false;
  },

  setSignalSender(sender: ((signal: WebRtcSignal) => void) | null): void {
    signalSender = sender;
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
    localStream?.getAudioTracks().forEach((track) => (track.enabled = false));
    bind(remoteVideoElement, null);
  },

  enableSessionMedia(): void {
    waitingRoomMode = false;
    if (!userMuted) localStream?.getAudioTracks().forEach((track) => (track.enabled = true));
    bind(remoteVideoElement, remoteStream);
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
    bind(localVideoElement, null);
    bind(remoteVideoElement, null);
    localVideoElement = null;
    remoteVideoElement = null;
    cameraEnabled = true;
    waitingRoomMode = false;
    userMuted = false;
    offerSent = false;
  },

  setMuted(muted: boolean): void {
    userMuted = muted;
    localStream?.getAudioTracks().forEach((track) => (track.enabled = !muted && !waitingRoomMode));
  },

  setCameraEnabled(enabled: boolean): void {
    cameraEnabled = enabled;
    localStream?.getVideoTracks().forEach((track) => (track.enabled = enabled));
    if (!enabled) bind(localVideoElement, null);
    else bind(localVideoElement, localStream);
  },

  rebindVideoElements(localVideo: HTMLVideoElement, remoteVideo: HTMLVideoElement): void {
    localVideoElement = localVideo;
    remoteVideoElement = remoteVideo;
    bind(localVideoElement, cameraEnabled ? localStream : null);
    bind(remoteVideoElement, waitingRoomMode ? null : remoteStream);
  },

  hasRemoteVideo(): boolean {
    return Boolean(remoteStream?.getVideoTracks().length);
  },
};
