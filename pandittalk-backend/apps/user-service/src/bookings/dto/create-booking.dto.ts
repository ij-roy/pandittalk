import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export const BOOKING_DEPTHS = ['entry', 'standard', 'deep'] as const;
// Scheduled bookings match the app: chat is created only through /bookings/chat-now.
// Existing stored Chat Now bookings remain readable as persisted records.
export const BOOKING_FORMATS = ['video', 'audio'] as const;
export const BOOKING_SESSION_MODELS = ['legacy_timed', 'no_timer'] as const;

export type BookingDepth = (typeof BOOKING_DEPTHS)[number];
export type BookingFormat = (typeof BOOKING_FORMATS)[number];
export type BookingSessionModel = (typeof BOOKING_SESSION_MODELS)[number];

export class CreateBookingDto {
  @IsUUID()
  panditId!: string;

  @IsDateString()
  startTime!: string;

  @IsString()
  area!: string;

  @IsIn(BOOKING_DEPTHS)
  depth!: BookingDepth;

  @IsIn(BOOKING_FORMATS)
  format!: BookingFormat;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(BOOKING_SESSION_MODELS)
  sessionModel?: BookingSessionModel;
}
