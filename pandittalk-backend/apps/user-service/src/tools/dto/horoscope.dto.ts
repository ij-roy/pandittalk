import { Transform } from 'class-transformer';
import { IsIn, IsString } from 'class-validator';
import { HOROSCOPE_TYPES, ZODIAC_SIGNS } from '../tools.constants';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class HoroscopeDto {
  @Transform(trim)
  @IsString()
  @IsIn(ZODIAC_SIGNS)
  sign!: string;

  @Transform(trim)
  @IsString()
  @IsIn(HOROSCOPE_TYPES)
  type!: 'daily' | 'monthly';
}
