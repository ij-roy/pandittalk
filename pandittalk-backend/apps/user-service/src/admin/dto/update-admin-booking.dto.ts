import { IsIn } from 'class-validator';

export const ADMIN_BOOKING_STATUSES = [
  'confirmed',
  'completed',
  'cancelled',
] as const;

export type AdminBookingStatus = (typeof ADMIN_BOOKING_STATUSES)[number];

export class UpdateAdminBookingDto {
  @IsIn(ADMIN_BOOKING_STATUSES)
  status!: AdminBookingStatus;
}
