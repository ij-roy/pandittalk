import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizePlace = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class KundliDto {
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @Transform(trim)
  @IsISO8601()
  dob!: string;

  @Transform(trim)
  @IsString()
  @MaxLength(50)
  timeOfBirth!: string;

  @Transform(trim)
  @Transform(normalizePlace)
  @IsString()
  @MaxLength(255)
  placeOfBirth!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  coordinates?: string;

  @IsOptional()
  @IsBoolean()
  detailed?: boolean;
}
