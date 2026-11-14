import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@pandittalk/common';
import { join } from 'path';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { ChimeModule } from './chime/chime.module';
import { ChatModule } from './chat/chat.module';
import { ExpertsModule } from './experts/experts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { RedisModule } from './redis/redis.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { ToolsModule } from './tools/tools.module';
import { WalletModule } from './wallet/wallet.module';
import { AvatarModule } from './avatar/avatar.module';
import { CustomerContractsModule } from './customer/customer-contracts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), 'apps/user-service/.env.local'),
        join(process.cwd(), 'apps/user-service/.env'),
        join(process.cwd(), '.env.local'),
        join(process.cwd(), '.env'),
      ],
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    ArticlesModule,
    ExpertsModule,
    BookingsModule,
    NotificationsModule,
    ReportsModule,
    WalletModule,
    ToolsModule,
    RedisModule,
    ChimeModule,
    ChatModule,
    AvatarModule,
    CustomerContractsModule,
  ],
  controllers: [UserServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule {}
