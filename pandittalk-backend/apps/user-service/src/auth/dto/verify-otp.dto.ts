import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  INDIA_MOBILE_E164_REGEX,
  normalizeIndiaPhone,
} from '../phone.util';

export class VerifyOtpDto {
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

  /**
   * Must be true — client checkbox: 18+ and agree to Terms & Privacy.
   * Accepts boolean true or string "true" from clients.
   */
  @Transform(({ value }: { value: unknown }) => {
    if (value === true || value === 'true' || value === 1 || value === '1') {
      return true;
    }
    if (value === false || value === 'false' || value === 0 || value === '0') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  @Equals(true, {
    message:
      'You must accept the Terms & Conditions and Privacy Policy to continue',
  })
  acceptedLegalConsent!: boolean;

  /** Pandit dashboard only — refuse login unless phone is a linked expert. */
  @IsOptional()
  @IsIn(['dashboard'])
  intent?: 'dashboard';
}
