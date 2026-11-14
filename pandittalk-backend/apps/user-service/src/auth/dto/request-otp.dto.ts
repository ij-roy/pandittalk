import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import {
  INDIA_MOBILE_E164_REGEX,
  normalizeIndiaPhone,
} from '../phone.util';

/**
 * Accepts `phoneNumber` or legacy/mobile key `phone`.
 * Normalizes to canonical India E.164 (`+91[6-9]#########`).
 */
export class RequestOtpDto {
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

  /** Pandit dashboard only — refuse OTP unless phone is a linked expert. */
  @IsOptional()
  @IsIn(['dashboard'])
  intent?: 'dashboard';
}
