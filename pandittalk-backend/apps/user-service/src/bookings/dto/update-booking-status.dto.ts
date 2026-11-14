import { IsIn } from 'class-validator';

export const BOOKING_STATUS_UPDATES = ['completed', 'cancelled'] as const;
export type BookingStatusUpdate = (typeof BOOKING_STATUS_UPDATES)[number];

export class UpdateBookingStatusDto {
  @IsIn(BOOKING_STATUS_UPDATES)
  status!: BookingStatusUpdate;
}
