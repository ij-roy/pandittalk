import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import {
  mediaDevices,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
  type MediaStream,
} from 'react-native-webrtc';
import { ensureCameraPermission, ensureMicrophonePermission } from '@/lib/mediaPermissions';
import { stopCallForegroundWatch, watchCallForeground } from '@/lib/callForeground';
import type { WebRtcSessionConfig, WebRtcSignal } from './webrtcTypes';

export type VideoTilesState = { localTileId: number | null; remoteTileId: number | null };
export type VideoTilePayload = { tileId: number; isLocal: boolean; isContent?: boolean };

let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;
let currentConfig: WebRtcSessionConfig | null = null;
let signalSender: ((signal: WebRtcSignal) => void) | null = null;
let tilesChangedHandler: ((tiles: VideoTilesState) => void) | null = null;
let errorHandler: ((message: string) => void) | null = null;
let localTileId: number | null = null;
let remoteTileId: number | null = null;
let cameraOn = true;
let sessionMediaActive = false;
let offerSent = false;

function emitTilesChanged(): void {
  tilesChangedHandler?.({ localTileId, remoteTileId });
}

function createPeer(): RTCPeerConnection {
  if (peerConnection) return peerConnection;
  if (!localStream || !currentConfig) throw new Error('Camera and microphone are not ready.');
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
  eventPeer.addEventListener('track', (raw) => {
    const event = raw as { streams?: MediaStream[] };
    remoteStream = event.streams?.[0] ?? remoteStream;
    remoteTileId = 2;
    emitTilesChanged();
  });
  eventPeer.addEventListener('connectionstatechange', () => {
    if (peer.connectionState === 'failed') peer.restartIce();
  });
  return peer;
}

export function VideoSurface({
  tileId,
  style,
  mirror,
}: {
  tileId: number;
  style?: StyleProp<ViewStyle>;
  mirror?: boolean;
}): React.JSX.Element | null {
  const stream = tileId === 1 ? localStream : remoteStream;
  if (!stream) return null;
  return React.createElement(RTCView, {
    streamURL: stream.toURL(),
    objectFit: 'cover',
    mirror,
    style: [styles.surface, style],
  });
}

export const webrtcVideo = {
  getTiles(): VideoTilesState {
    return { localTileId, remoteTileId };
  },

  setTilesChangedHandler(handler: ((tiles: VideoTilesState) => void) | null): void {
    tilesChangedHandler = handler;
    if (handler) handler({ localTileId, remoteTileId });
  },

  setErrorHandler(handler: ((message: string) => void) | null): void {
    errorHandler = handler;
  },

  async startVideoSession(config: WebRtcSessionConfig): Promise<void> {
    await this.stopVideoSession();
    await ensureMicrophonePermission();
    await ensureCameraPermission();
    try {
      currentConfig = config;
      localStream = await mediaDevices.getUserMedia({ audio: true, video: true });
      localTileId = 1;
      remoteTileId = null;
      cameraOn = true;
      sessionMediaActive = false;
      offerSent = false;
      localStream.getTracks().forEach((track) => (track.enabled = false));
      localStream.getVideoTracks().forEach((track) => (track.enabled = true));
      emitTilesChanged();
      watchCallForeground();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to access camera and microphone.';
      errorHandler?.(message);
      throw error;
    }
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
    emitTilesChanged();
  },

  enableSessionMedia(): void {
    sessionMediaActive = true;
    localStream?.getAudioTracks().forEach((track) => (track.enabled = true));
    emitTilesChanged();
  },

  async stopVideoSession(): Promise<void> {
    stopCallForegroundWatch();
    peerConnection?.close();
    peerConnection = null;
    localStream?.getTracks().forEach((track) => track.stop());
    localStream = null;
    remoteStream = null;
    currentConfig = null;
    signalSender = null;
    localTileId = null;
    remoteTileId = null;
    cameraOn = true;
    sessionMediaActive = false;
    offerSent = false;
    emitTilesChanged();
  },

  toggleCamera(): boolean {
    cameraOn = !cameraOn;
    localStream?.getVideoTracks().forEach((track) => (track.enabled = cameraOn));
    emitTilesChanged();
    return cameraOn;
  },

  isCameraOn(): boolean {
    return cameraOn;
  },

  flipCamera(): void {
    const track = localStream?.getVideoTracks()[0] as (MediaStreamTrack & { _switchCamera?: () => void }) | undefined;
    track?._switchCamera?.();
  },

  toggleMute(muted: boolean): boolean {
    localStream?.getAudioTracks().forEach((track) => (track.enabled = !muted && sessionMediaActive));
    return Boolean(localStream);
  },
};

const styles = StyleSheet.create({ surface: { flex: 1 } });
