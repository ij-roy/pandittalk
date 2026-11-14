import { IsUUID } from 'class-validator';

export class AudioSessionDto {
  @IsUUID()
  bookingId!: string;
}
