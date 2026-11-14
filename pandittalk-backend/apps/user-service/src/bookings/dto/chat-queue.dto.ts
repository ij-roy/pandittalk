import { IsUUID } from 'class-validator';

export class ChatQueueDto {
  @IsUUID()
  panditId!: string;
}
