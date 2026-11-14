import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { BookingsModule } from '../bookings/bookings.module';
import { ChimeModule } from '../chime/chime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { ChatGateway } from './chat.gateway';
import { DynamoService } from './dynamo.service';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ChimeModule,
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
  providers: [ChatGateway, DynamoService],
  exports: [ChatGateway, DynamoService],
})
export class ChatModule {}
