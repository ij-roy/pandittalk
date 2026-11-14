import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import {
  INDIA_MOBILE_E164_REGEX,
  normalizeIndiaPhone,
} from '../phone.util';

export class CompleteSocialDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  pendingToken!: string;

  @Transform(({ obj }: { obj: Record<string, unknown> }) => {
    const raw = obj['phoneNumber'] ?? obj['phone'];
    if (typeof raw !== 'string') {
      return raw;
    }
    return normalizeIndiaPhone(raw) ?? raw.trim();
  })
  @IsString()
  @IsNotEmpty()
  @Matches(INDIA_MOBILE_E164_REGEX, {
    message: 'phoneNumber must be a valid Indian mobile in E.164 (+91…)',
  })
  phoneNumber!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(4)
  @Matches(/^\d{4}$/, { message: 'otp must be exactly 4 digits' })
  otp!: string;
}
