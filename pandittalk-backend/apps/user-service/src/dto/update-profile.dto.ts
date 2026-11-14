import { Transform } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class UpdateProfileDto {
  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsString()
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: string;

  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsString()
  @IsIn(['single', 'married', 'divorced', 'widowed', 'other'])
  maritalStatus?: string;

  /** ISO-8601 date (e.g. "1995-08-21" or full datetime). Stored as string. */
  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsISO8601()
  dob?: string;

  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(50)
  timeOfBirth?: string;

  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(255)
  placeOfBirth?: string;

  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsString()
  @IsIn([
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
    'capricorn',
    'aquarius',
    'pisces',
  ])
  zodiacSign?: string;

  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(500)
  currentAddress?: string;

  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @Transform(trim)
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(500)
  profileImageUrl?: string;
}
