import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ChatNowDto {
  @IsUUID()
  panditId!: string;

  @IsString()
  area!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
