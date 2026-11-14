import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizePlace = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class PersonDto {
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  name!: string;

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
}

export class CompatibilityDto {
  @ValidateNested()
  @Type(() => PersonDto)
  person1!: PersonDto;

  @ValidateNested()
  @Type(() => PersonDto)
  person2!: PersonDto;

  @IsOptional()
  @IsBoolean()
  detailed?: boolean;
}
