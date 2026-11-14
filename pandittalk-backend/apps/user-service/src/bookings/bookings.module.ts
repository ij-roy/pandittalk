import { forwardRef, Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PanditAvailabilityService } from './pandit-availability.service';
import { PanditQueueService } from './pandit-queue.service';

@Module({
  imports: [
    forwardRef(() => ChatModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, PanditAvailabilityService, PanditQueueService],
  exports: [BookingsService, PanditAvailabilityService, PanditQueueService],
})
export class BookingsModule {}
