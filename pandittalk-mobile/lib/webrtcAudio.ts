import {
  mediaDevices,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  type MediaStream,
} from 'react-native-webrtc';
import { ensureMicrophonePermission } from '@/lib/mediaPermissions';
import { stopCallForegroundWatch, watchCallForeground } from '@/lib/callForeground';
import type { WebRtcSessionConfig, WebRtcSignal } from './webrtcTypes';

export type RemoteVolumePayload = { volume: number; muted: boolean };
export type MicActivityHandler = (payload: RemoteVolumePayload) => void;

let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let currentConfig: WebRtcSessionConfig | null = null;
let signalSender: ((signal: WebRtcSignal) => void) | null = null;
let remoteVolumeHandler: MicActivityHandler | null = null;
let sessionMediaActive = false;
let offerSent = false;

function createPeer(): RTCPeerConnection {
  if (peerConnection) return peerConnection;
  if (!localStream || !currentConfig) throw new Error('Microphone is not ready.');
  const peer = new RTCPeerConnection({ iceServers: currentConfig.iceServers });
  peerConnection = peer;
  localStream.getTracks().forEach((track) => peer.addTrack(track, localStream!));
  const eventPeer = peer as unknown as {
    addEventListener: (name: string, handler: (event: unknown) => void) => void;
  };
  eventPeer.addEventListener('icecandidate', (raw) => {
    const event = raw as { candidate?: { toJSON?: () => Record<string, unknown> } | null };
    if (event.candidate) signalSender?.({ type: 'ice-candidate', candidate: event.candidate.toJSON?.() ?? null });
  });
  eventPeer.addEventListener('track', () => {
    if (sessionMediaActive) remoteVolumeHandler?.({ volume: 1, muted: false });
  });
  return peer;
}

export const webrtcAudio = {
  async startSession(config: WebRtcSessionConfig): Promise<void> {
    await this.stopSession();
    await ensureMicrophonePermission();
    currentConfig = config;
    localStream = await mediaDevices.getUserMedia({ audio: true, video: false });
    localStream.getAudioTracks().forEach((track) => (track.enabled = false));
    sessionMediaActive = false;
    offerSent = false;
    watchCallForeground();
  },

  setSignalSender(sender: ((signal: WebRtcSignal) => void) | null): void {
    signalSender = sender;
  },

  async handlePeerReady(initiator: boolean): Promise<void> {
    const peer = createPeer();
    if (!initiator || offerSent || peer.signalingState !== 'stable') return;
    offerSent = true;
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      if (offer.sdp) signalSender?.({ type: 'offer', sdp: offer.sdp });
    } catch (error) {
      offerSent = false;
      throw error;
    }
  },

  async handleSignal(signal: WebRtcSignal): Promise<void> {
    const peer = createPeer();
    if (signal.type === 'ice-candidate') {
      if (signal.candidate) await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
      return;
    }
    if (signal.type === 'answer' && peer.signalingState !== 'have-local-offer') return;
    if (signal.type === 'offer' && peer.signalingState !== 'stable') return;
    await peer.setRemoteDescription(new RTCSessionDescription({ type: signal.type, sdp: signal.sdp }));
    if (signal.type === 'offer') {
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      if (answer.sdp) signalSender?.({ type: 'answer', sdp: answer.sdp });
    }
  },

  enterWaitingRoomMode(): void {
    sessionMediaActive = false;
    localStream?.getAudioTracks().forEach((track) => (track.enabled = false));
  },

  enableSessionMedia(): void {
    sessionMediaActive = true;
    localStream?.getAudioTracks().forEach((track) => (track.enabled = true));
  },

  isSessionMediaActive(): boolean {
    return sessionMediaActive;
  },

  async stopSession(): Promise<void> {
    stopCallForegroundWatch();
    peerConnection?.close();
    peerConnection = null;
    localStream?.getTracks().forEach((track) => track.stop());
    localStream = null;
    currentConfig = null;
    signalSender = null;
    sessionMediaActive = false;
    offerSent = false;
  },

  setMuted(muted: boolean): boolean {
    localStream?.getAudioTracks().forEach((track) => (track.enabled = !muted && sessionMediaActive));
    return Boolean(localStream);
  },

  setSpeakerOn(_on: boolean): void {
    // Native WebRTC uses the device audio route; no paid media SDK is involved.
  },

  setRemoteVolumeHandler(handler: MicActivityHandler | null): void {
    remoteVolumeHandler = handler;
  },
};
