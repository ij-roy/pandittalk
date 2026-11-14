import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { parseClientPlatform } from '../common/client-platform';
import {
  BookingsService,
  type BookingDetail,
  type BookingListItem,
  type BookingReviewSummary,
  type BookingUserDetails,
  type SharedBookingContext,
  type CreatedBookingResponse,
} from './bookings.service';
import { ChatQueueDto } from './dto/chat-queue.dto';
import { ChatNowDto } from './dto/create-chat-now.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import {
  PanditAvailabilityService,
  type PanditLiveStatus,
} from './pandit-availability.service';
import {
  PanditQueueService,
  type QueueJoinResult,
  type QueuePositionResult,
} from './pandit-queue.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly panditAvailability: PanditAvailabilityService,
    private readonly panditQueue: PanditQueueService,
  ) {}

  @Post()
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateBookingDto,
    @Headers('x-client-platform') clientPlatform?: string,
  ): Promise<CreatedBookingResponse> {
    return this.bookingsService.create(
      userId,
      dto.panditId,
      dto.startTime,
      dto.area,
      dto.depth,
      dto.format,
      dto.notes,
      dto.sessionModel,
      parseClientPlatform(clientPlatform),
    );
  }

  @Post('chat-now')
  createChatNow(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChatNowDto,
  ): Promise<CreatedBookingResponse> {
    return this.bookingsService.createChatNow(userId, dto);
  }

  @Post('chat-now/queue')
  joinChatQueue(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChatQueueDto,
  ): Promise<QueueJoinResult> {
    return this.panditQueue.joinQueue(userId, dto.panditId);
  }

  @Delete('chat-now/queue')
  leaveChatQueue(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChatQueueDto,
  ): Promise<void> {
    return this.panditQueue.leaveQueue(userId, dto.panditId);
  }

  @Get('chat-now/queue')
  getChatQueuePosition(
    @CurrentUser('sub') userId: string,
    @Query('panditId') panditId: string,
  ): Promise<QueuePositionResult> {
    return this.panditQueue.getPosition(userId, panditId);
  }

  @Get()
  findAll(@CurrentUser('sub') userId: string): Promise<BookingListItem[]> {
    return this.bookingsService.findAllForUser(userId);
  }

  @Get('pandit')
  findAllForPandit(
    @CurrentUser('sub') userId: string,
  ): Promise<BookingListItem[]> {
    return this.bookingsService.findAllForPanditUser(userId);
  }

  @Get('pandit/:panditId/status')
  getPanditLiveStatus(
    @Param('panditId') panditId: string,
  ): Promise<PanditLiveStatus> {
    return this.panditAvailability.getLiveStatus(panditId);
  }

  @Get(':id/user-details')
  findUserDetails(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ): Promise<BookingUserDetails> {
    return this.bookingsService.findUserDetailsForPandit(userId, id);
  }

  @Get(':id/shared-context')
  findSharedContext(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ): Promise<SharedBookingContext[]> {
    return this.bookingsService.findSharedContext(userId, id);
  }

  @Get(':id')
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ): Promise<BookingDetail> {
    return this.bookingsService.findOneForUser(userId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ): Promise<BookingDetail> {
    return this.bookingsService.updateStatus(userId, id, dto.status);
  }

  @Patch(':id/reschedule')
  reschedule(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto,
  ): Promise<BookingDetail> {
    return this.bookingsService.reschedule(userId, id, dto.startTime);
  }

  @Post(':id/pandit-cancel')
  cancelAsPandit(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ): Promise<BookingDetail> {
    return this.bookingsService.cancelForPanditUser(userId, id);
  }

  @Post(':id/review')
  createReview(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ): Promise<BookingReviewSummary> {
    return this.bookingsService.createReview(
      userId,
      id,
      dto.rating,
      dto.comment,
    );
  }
}
