import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpoPushService } from './expo-push.service';
import {
  NotificationsService,
  type NotificationPayload,
} from './notifications.service';

class RegisterPushDeviceDto {
  @IsString()
  @MinLength(8)
  @MaxLength(512)
  token!: string;

  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform!: string;
}

class UnregisterPushDeviceDto {
  @IsString()
  @MinLength(8)
  @MaxLength(512)
  token!: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly expoPush: ExpoPushService,
  ) {}

  @Get()
  findAll(
    @CurrentUser('sub') userId: string,
  ): Promise<NotificationPayload[]> {
    return this.notificationsService.findAllForUser(userId);
  }

  @Get('unread-count')
  getUnreadCount(
    @CurrentUser('sub') userId: string,
  ): Promise<{ count: number }> {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  markAllRead(
    @CurrentUser('sub') userId: string,
  ): Promise<{ updated: number }> {
    return this.notificationsService.markAllRead(userId);
  }

  @Post('push-token')
  registerPush(
    @CurrentUser('sub') userId: string,
    @Body() dto: RegisterPushDeviceDto,
  ) {
    return this.expoPush.registerDevice(userId, dto.token, dto.platform);
  }

  @Delete('push-token')
  unregisterPush(
    @CurrentUser('sub') userId: string,
    @Body() dto: UnregisterPushDeviceDto,
  ) {
    return this.expoPush.unregisterDevice(userId, dto.token);
  }

  @Patch(':id/read')
  markOneRead(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationPayload> {
    return this.notificationsService.markOneRead(userId, id);
  }
}
