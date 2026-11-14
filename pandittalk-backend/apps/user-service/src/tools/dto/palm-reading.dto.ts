import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class PalmReadingDto {
  @Transform(trim)
  @IsString()
  leftPalmImage!: string;

  @Transform(trim)
  @IsString()
  rightPalmImage!: string;
}
