import { IsBoolean, IsEmail, IsIn, IsOptional, IsPhoneNumber, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateContextDto { @IsString() @MinLength(1) @MaxLength(2000) text!: string; }
export class UpdateContextDto { @IsString() @MinLength(1) @MaxLength(2000) text!: string; }
export class ShareContextDto { @IsUUID() bookingId!: string; @IsUUID() panditId!: string; }
export class RevokeContextDto { @IsUUID() bookingId!: string; }
export class NotificationPreferencesDto { @IsOptional() @IsBoolean() bookingReminders?: boolean; @IsOptional() @IsBoolean() sessionUpdates?: boolean; @IsOptional() @IsBoolean() messages?: boolean; @IsOptional() @IsBoolean() marketing?: boolean; }
export class PhoneChangeRequestDto { @IsPhoneNumber('IN') phoneNumber!: string; }
export class PhoneChangeVerifyDto { @IsUUID() challengeId!: string; @IsString() @MinLength(4) @MaxLength(4) otp!: string; }
export class SupportRequestDto { @IsString() @MaxLength(50) category!: string; @IsString() @MinLength(1) @MaxLength(4000) message!: string; @IsOptional() @IsEmail() email?: string; }
export class BlockPanditDto { @IsUUID() panditId!: string; }
export class PanditApplicationDto { @IsString() @MinLength(2) @MaxLength(150) name!: string; @IsPhoneNumber('IN') phone!: string; @IsOptional() @IsEmail() email?: string; @IsString() @MinLength(2) @MaxLength(150) practice!: string; @IsString({ each: true }) @MaxLength(40, { each: true }) languages!: string[]; @IsOptional() @MaxLength(2000) message?: string; @IsBoolean() consent!: boolean; }
export class CreateFamilyMemberDto {
  @IsIn(['spouse', 'child', 'parent', 'other']) relation!: 'spouse' | 'child' | 'parent' | 'other';
  @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @IsString() dob!: string;
  @IsString() timeOfBirth!: string;
  @IsString() @MinLength(2) @MaxLength(120) placeOfBirth!: string;
  @IsOptional() @IsString() coordinates?: string;
}
