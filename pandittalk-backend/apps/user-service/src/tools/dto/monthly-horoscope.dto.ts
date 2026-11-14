import { Transform } from 'class-transformer';
import { IsIn, IsString } from 'class-validator';
import { ZODIAC_SIGNS } from '../tools.constants';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class MonthlyHoroscopeDto {
  @Transform(trim)
  @IsString()
  @IsIn(ZODIAC_SIGNS)
  sign!: string;
}
