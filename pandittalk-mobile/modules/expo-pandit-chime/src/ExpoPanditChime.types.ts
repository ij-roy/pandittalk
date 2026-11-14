export type ChimeMediaPlacement = {
  AudioHostUrl?: string;
  AudioFallbackUrl?: string;
  SignalingUrl?: string;
  TurnControlUrl?: string;
};

export type ChimeMeeting = {
  MeetingId?: string;
  ExternalMeetingId?: string;
  MediaRegion?: string;
  MediaPlacement?: ChimeMediaPlacement;
};

export type ChimeAttendee = {
  AttendeeId?: string;
  ExternalUserId?: string;
  JoinToken?: string;
};

export type VideoTilePayload = {
  tileId: number;
  attendeeId: string;
  isLocal: boolean;
  isContent: boolean;
};
