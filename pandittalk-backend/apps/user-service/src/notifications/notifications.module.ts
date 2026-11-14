import { forwardRef, Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ExpoPushService } from './expo-push.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule, forwardRef(() => ChatModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService, ExpoPushService],
  exports: [NotificationsService, ExpoPushService],
})
export class NotificationsModule {}
