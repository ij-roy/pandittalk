import { IsIn } from 'class-validator';

export const ADMIN_APPLICATION_STATUSES = [
  'received',
  'reviewing',
  'approved',
  'rejected',
] as const;

export type AdminApplicationStatus =
  (typeof ADMIN_APPLICATION_STATUSES)[number];

export class UpdateAdminApplicationDto {
  @IsIn(ADMIN_APPLICATION_STATUSES)
  status!: AdminApplicationStatus;
}
