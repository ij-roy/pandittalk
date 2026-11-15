import type { Socket } from 'socket.io-client';

export type WebRtcSignal =
  | { type: 'offer' | 'answer'; sdp: string }
  | { type: 'ice-candidate'; candidate: Record<string, unknown> | null };

export interface WebRtcSessionConfig {
  provider: 'webrtc';
  bookingId: string;
  format: 'audio' | 'video';
  iceServers: RTCConfiguration['iceServers'];
}

export interface WebRtcElements {
  localVideo?: HTMLVideoElement | null;
  remoteVideo?: HTMLVideoElement | null;
}

export class BrowserWebRtcSession {
  private readonly config: WebRtcSessionConfig;
  private readonly format: 'audio' | 'video';
  private readonly elements: WebRtcElements;
  private peer: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private signalSender: ((signal: WebRtcSignal) => void) | null = null;
  private waitingRoom = true;
  private muted = false;
  private cameraEnabled = true;
  private offerSent = false;

  constructor(config: WebRtcSessionConfig, format: 'audio' | 'video', elements: WebRtcElements) {
    this.config = config;
    this.format = format;
    this.elements = elements;
  }

  async start(audioDeviceId?: string, videoDeviceId?: string): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Media devices are not supported in this browser.');
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
        },
        ...(this.format === 'video'
          ? { video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true }
          : { video: false }),
      });
    } catch {
      throw new Error('Camera or microphone permission denied. Allow access for this site, then reload.');
    }
    this.waitingRoom = true;
    this.offerSent = false;
    this.localStream.getAudioTracks().forEach((track) => (track.enabled = false));
    if (this.format === 'video') {
      this.bind(this.elements.localVideo, this.localStream);
      this.localStream.getVideoTracks().forEach((track) => (track.enabled = true));
    }
  }

  setSignalSender(sender: ((signal: WebRtcSignal) => void) | null): void {
    this.signalSender = sender;
  }

  async handlePeerReady(initiator: boolean): Promise<void> {
    const peer = this.createPeer();
    if (!initiator || this.offerSent || peer.signalingState !== 'stable') return;
    this.offerSent = true;
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      if (offer.sdp) this.signalSender?.({ type: 'offer', sdp: offer.sdp });
    } catch (error) {
      this.offerSent = false;
      throw error;
    }
  }

  async handleSignal(signal: WebRtcSignal): Promise<void> {
    const peer = this.createPeer();
    if (signal.type === 'ice-candidate') {
      if (signal.candidate) await peer.addIceCandidate(signal.candidate as RTCIceCandidateInit);
      return;
    }
    if (signal.type === 'answer' && peer.signalingState !== 'have-local-offer') return;
    if (signal.type === 'offer' && peer.signalingState !== 'stable') return;
    await peer.setRemoteDescription({ type: signal.type, sdp: signal.sdp });
    if (signal.type === 'offer') {
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      if (answer.sdp) this.signalSender?.({ type: 'answer', sdp: answer.sdp });
    }
  }

  enterWaitingRoomMode(): void {
    this.waitingRoom = true;
    this.localStream?.getAudioTracks().forEach((track) => (track.enabled = false));
    this.bind(this.elements.remoteVideo, null);
  }

  enableSessionMedia(): void {
    this.waitingRoom = false;
    if (!this.muted) this.localStream?.getAudioTracks().forEach((track) => (track.enabled = true));
    this.bind(this.elements.remoteVideo, this.remoteStream);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.localStream?.getAudioTracks().forEach((track) => (track.enabled = !muted && !this.waitingRoom));
  }

  setCameraEnabled(enabled: boolean): void {
    this.cameraEnabled = enabled;
    this.localStream?.getVideoTracks().forEach((track) => (track.enabled = enabled));
    this.bind(this.elements.localVideo, enabled ? this.localStream : null);
  }

  hasRemoteVideo(): boolean {
    return Boolean(this.remoteStream?.getVideoTracks().length);
  }

  async stop(): Promise<void> {
    this.peer?.close();
    this.peer = null;
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.remoteStream = null;
    this.offerSent = false;
    this.bind(this.elements.localVideo, null);
    this.bind(this.elements.remoteVideo, null);
    this.signalSender = null;
  }

  private createPeer(): RTCPeerConnection {
    if (this.peer) return this.peer;
    if (!this.localStream) throw new Error('Media devices are not ready.');
    const peer = new RTCPeerConnection({ iceServers: this.config.iceServers });
    this.peer = peer;
    this.localStream.getTracks().forEach((track) => peer.addTrack(track, this.localStream!));
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalSender?.({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON() as Record<string, unknown>,
        });
      }
    };
    peer.ontrack = (event) => {
      this.remoteStream = event.streams[0] ?? this.remoteStream;
      if (!this.waitingRoom) this.bind(this.elements.remoteVideo, this.remoteStream);
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'failed') peer.restartIce();
    };
    return peer;
  }

  private bind(element: HTMLVideoElement | null | undefined, stream: MediaStream | null): void {
    if (!element) return;
    element.srcObject = stream;
    if (stream) element.play().catch(() => undefined);
  }
}

export function bindSocketMediaSignals(
  socket: Socket,
  session: BrowserWebRtcSession,
  bookingId: string,
  format: 'audio' | 'video',
): void {
  session.setSignalSender((signal) => socket.emit('mediaSignal', { bookingId, format, signal }));
}
