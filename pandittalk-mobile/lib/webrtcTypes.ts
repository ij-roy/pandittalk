export type WebRtcSignal =
  | { type: 'offer' | 'answer'; sdp: string }
  | { type: 'ice-candidate'; candidate: Record<string, unknown> | null };

export interface WebRtcSessionConfig {
  provider: 'webrtc';
  bookingId: string;
  format: 'audio' | 'video';
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
}
