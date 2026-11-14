import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  /** Native clients send the refresh token in the body; browsers use the httpOnly cookie. */
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
