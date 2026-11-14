import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { HealthResponseDto } from '@pandittalk/common';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  UserProfilePayload,
  UserServiceService,
} from './user-service.service';
import { readFeatureFlags } from './config/feature-flags';

@Controller()
export class UserServiceController {
  constructor(
    private readonly userServiceService: UserServiceService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  getHealth(): HealthResponseDto {
    return this.userServiceService.getHealth();
  }

  /**
   * Public force/soft update policy for mobile clients (#236).
   * Ops bumps IOS_/ANDROID_ version env vars without an app release.
   */
  @Get('public/app-update')
  getAppUpdatePolicy() {
    const iosLatest = this.config.get<string>('IOS_LATEST_VERSION', '1.0.9');
    const iosMin = this.config.get<string>('IOS_MIN_SUPPORTED_VERSION', '1.0.0');
    const androidLatest = this.config.get<string>(
      'ANDROID_LATEST_VERSION',
      '1.0.9',
    );
    const androidMin = this.config.get<string>(
      'ANDROID_MIN_SUPPORTED_VERSION',
      '1.0.0',
    );
    const iosStore =
      this.config.get<string>('IOS_STORE_URL') ??
      'https://apps.apple.com/app/id6797837559';
    const androidStore =
      this.config.get<string>('ANDROID_STORE_URL') ??
      'https://play.google.com/store/apps/details?id=com.pandittalk.mobile';
    const message =
      this.config.get<string>('APP_UPDATE_MESSAGE') ??
      'A new version of PanditTalk is available. Please update for the best experience.';

    return {
      ios: {
        latestVersion: iosLatest,
        minSupportedVersion: iosMin,
        storeUrl: iosStore,
        message,
      },
      android: {
        latestVersion: androidLatest,
        minSupportedVersion: androidMin,
        storeUrl: androidStore,
        message,
      },
    };
  }

  /** Kill switches for payments and paid digital tools. No auth, so the app can read them before sign-in. */
  @Get('config/features')
  getFeatureFlags() {
    return readFeatureFlags();
  }

  /** Returns the authenticated user's full profile from the database. */
  @UseGuards(JwtAuthGuard)
  @Get('users/profile')
  async getProfile(
    @CurrentUser('sub') userId: string,
  ): Promise<UserProfilePayload> {
    return this.userServiceService.getProfile(userId);
  }

  /** Updates the authenticated user's profile and marks it as completed. */
  @UseGuards(JwtAuthGuard)
  @Patch('users/profile')
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfilePayload> {
    return this.userServiceService.updateProfile(userId, dto);
  }

  /** Upload or replace the authenticated user's profile avatar. */
  @UseGuards(JwtAuthGuard)
  @Post('users/profile/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ profileImageUrl: string }> {
    return this.userServiceService.uploadAvatar(userId, file);
  }

  /** Soft-deletes the authenticated user's account. */
  @UseGuards(JwtAuthGuard)
  @Delete('users/profile')
  async deleteProfile(
    @CurrentUser('sub') userId: string,
  ): Promise<{ success: true }> {
    return this.userServiceService.softDeleteProfile(userId);
  }
}
