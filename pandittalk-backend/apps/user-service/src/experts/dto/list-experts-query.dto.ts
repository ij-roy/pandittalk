import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export const EXPERT_AREA_IDS = [
  'career_business',
  'love_relationships',
  'finance_wealth',
  'marriage_family',
  'legal_advice',
  'health_wellbeing',
  'life_path',
  'spiritual_protection',
] as const;

export type ExpertAreaId = (typeof EXPERT_AREA_IDS)[number];

/** Booking flow area keys (guidance / profile setup). */
export const BOOKING_AREA_IDS = [
  'career',
  'love',
  'family',
  'marriage',
  'education',
  'health',
  'business',
  'finance',
] as const;

export type BookingAreaId = (typeof BOOKING_AREA_IDS)[number];

/** Expert filter IDs plus guidance booking area keys accepted by ?area=. */
export const ALLOWED_AREA_QUERY_VALUES = [
  ...EXPERT_AREA_IDS,
  ...BOOKING_AREA_IDS,
] as const;

export class ListExpertsQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn([...ALLOWED_AREA_QUERY_VALUES])
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  area?: string;
}
