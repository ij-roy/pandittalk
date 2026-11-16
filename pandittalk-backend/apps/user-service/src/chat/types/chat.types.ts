export type SenderRole = 'pandit' | 'user';

export interface ChatMessage {
  sessionId: string;
  senderId: string;
  senderRole: SenderRole;
  message: string;
  timestamp: number;
}

export interface JoinSessionPayload {
  bookingId: string;
  token?: string;
}

export interface SendMessagePayload {
  bookingId: string;
  message: string;
}

export interface BookingSessionPayload {
  bookingId: string;
}

export interface TypingPayload {
  bookingId: string;
}

export type SessionRefundReason =
  | 'pandit_unavailable'
  | 'ended_before_start'
  | 'pandit_timeout'
  | 'grace_period';

export interface SessionRefundedPayload {
  reason: SessionRefundReason;
  coinsRefunded: number;
  message: string;
}

export interface SessionEndedWithRefundPayload {
  coinsRefunded: number;
  message: string;
}

export interface PanditBusyPayload {
  bookingId: string;
  reason: 'on_another_call';
  activeBookingEndsAt: string | null;
  message: string;
}

export interface QueuePositionUpdatedPayload {
  panditId: string;
  position: number;
  queueLength: number;
  estimatedWaitMinutes: number;
}

export interface QueueReadyPayload {
  panditId: string;
  expiresAt: string;
  message: string;
}

export type QueueExpiredReason = 'turn_timeout' | 'max_wait' | 'pandit_offline';

export interface QueueExpiredPayload {
  panditId: string;
  reason: QueueExpiredReason;
}

export interface NewBookingCreatedPayload {
  bookingId: string;
  panditId: string;
  area: string;
}

export interface JoinPanditDashboardPayload {
  panditId?: string;
  token?: string;
}

export interface JoinAudioSessionPayload {
  bookingId: string;
  token?: string;
}

export interface AudioSessionStartedPayload {
  startedAt: number;
  endTime: number;
  durationMinutes: number;
}

export interface AudioWaitingForOtherPayload {
  bookingId: string;
  waitingForRole?: SenderRole;
}

export interface AudioWaitingForStartPayload {
  startsAt: string;
  otherRole?: SenderRole;
}

export interface AudioSessionEndedPayload {
  bookingId: string;
}

export interface AudioParticipantLeftPayload {
  bookingId: string;
}

export interface AudioParticipantRejoinedPayload {
  bookingId: string;
}

export interface JoinVideoSessionPayload {
  bookingId: string;
  token?: string;
}

export type WebRtcSignal =
  | { type: 'offer' | 'answer'; sdp: string }
  | { type: 'ice-candidate'; candidate: Record<string, unknown> | null };

export interface MediaSignalPayload {
  bookingId: string;
  format: 'audio' | 'video';
  signal: WebRtcSignal;
}

export interface MediaPeerReadyPayload {
  bookingId: string;
  format: 'audio' | 'video';
  initiator: boolean;
}

export interface VideoSessionStartedPayload {
  startedAt: number;
  endTime: number;
  durationMinutes: number;
}

export interface VideoWaitingForOtherPayload {
  bookingId: string;
  waitingForRole?: SenderRole;
}

export interface VideoWaitingForStartPayload {
  startsAt: string;
  otherRole?: SenderRole;
}

export interface SessionGraceEndedPayload {
  bookingId: string;
  message: string;
}

export interface VideoCameraStatePayload {
  bookingId: string;
  cameraOn: boolean;
  senderRole?: SenderRole;
}

export interface VideoSessionEndedPayload {
  bookingId: string;
}

export interface VideoParticipantLeftPayload {
  bookingId: string;
}

export interface VideoParticipantRejoinedPayload {
  bookingId: string;
}
