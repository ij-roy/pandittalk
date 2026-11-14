import { IsISO8601, IsString } from 'class-validator';

export class HealthResponseDto {
  @IsString()
  status!: string;

  @IsString()
  service!: string;

  @IsISO8601()
  timestamp!: string;
}
