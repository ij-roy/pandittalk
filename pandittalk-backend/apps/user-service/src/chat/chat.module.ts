import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { CHAT_STORAGE } from './chat-storage.interface';
import { ChatGateway } from './chat.gateway';
import { MongoChatService } from './mongo-chat.service';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    forwardRef(() => BookingsModule),
    forwardRef(() => NotificationsModule),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not configured');
        }
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '7d');
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as unknown as number,
          },
        };
      },
    }),
  ],
  providers: [
    ChatGateway,
    MongoChatService,
    { provide: CHAT_STORAGE, useExisting: MongoChatService },
  ],
  exports: [ChatGateway, CHAT_STORAGE, MongoChatService],
})
export class ChatModule {}
