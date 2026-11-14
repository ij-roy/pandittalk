import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  idToken!: string;

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
}
