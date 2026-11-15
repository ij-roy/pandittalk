import { IsUUID } from 'class-validator';

export class VideoSessionDto {
  @IsUUID()
  bookingId!: string;
}
