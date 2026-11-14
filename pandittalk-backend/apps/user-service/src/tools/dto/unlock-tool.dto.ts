import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export const UNLOCK_TOOL_TYPES = [
  'monthly_horoscope',
  'detailed_kundli',
  'detailed_compatibility',
] as const;

export type UnlockToolType = (typeof UNLOCK_TOOL_TYPES)[number];

export class MonthlyHoroscopeReportPayloadDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sign?: string;

  @IsString()
  monthlyOverview!: string;

  @IsString()
  career!: string;

  @IsString()
  relationships!: string;

  @IsString()
  health!: string;

  @IsString()
  keyOpportunities!: string;
}

export class UnlockToolDto {
  @IsString()
  @IsIn(UNLOCK_TOOL_TYPES)
  toolType!: UnlockToolType;

  @IsOptional()
  @ValidateNested()
  @Type(() => MonthlyHoroscopeReportPayloadDto)
  reportPayload?: MonthlyHoroscopeReportPayloadDto;
}
