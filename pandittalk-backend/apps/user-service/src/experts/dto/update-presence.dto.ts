import { IsBoolean } from 'class-validator';

export class UpdatePresenceDto {
  @IsBoolean()
  isOnline!: boolean;
}
