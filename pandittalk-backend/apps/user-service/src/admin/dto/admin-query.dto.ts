import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { USER_ROLES } from '../../auth/types/user-role';

function emptyToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

export class AdminQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => emptyToUndefined(value))
  search?: string;

  @IsOptional()
  @IsIn(USER_ROLES)
  @Transform(({ value }) => emptyToUndefined(value))
  role?: (typeof USER_ROLES)[number];

  @IsOptional()
  @IsString()
  @Transform(({ value }) => emptyToUndefined(value))
  status?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => emptyToUndefined(value))
  format?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value === undefined || value === '' ? 1 : value))
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => (value === undefined || value === '' ? 20 : value))
  pageSize = 20;
}
