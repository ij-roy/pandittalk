import type { Attendee, Meeting } from '@aws-sdk/client-chime-sdk-meetings';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { Booking } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ChimeService } from './chime.service';
import { VideoSessionDto } from './dto/video-session.dto';

type BookingWithPanditUser = Booking & {
  pandit: { userId: string | null };
};

const PRE_START_WINDOW_MS = 15 * 60 * 1000;

@Controller('sessions/video')
@UseGuards(JwtAuthGuard)
export class VideoChimeController {
  constructor(
    private readonly chimeService: ChimeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('create')
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: VideoSessionDto,
  ): Promise<{ meeting: Meeting; attendee: Attendee }> {
    const booking = await this.assertBookingOwner(userId, dto.bookingId);
    this.assertWithinSessionWindow(booking);
    const meeting = await this.chimeService.ensureMeeting(
      dto.bookingId,
      booking.durationMinutes,
    );
    const attendee = await this.chimeService.createAttendee(
      dto.bookingId,
      userId,
      booking.durationMinutes,
    );
    return { meeting, attendee };
  }

  @Post('join')
  async join(
    @CurrentUser('sub') userId: string,
    @Body() dto: VideoSessionDto,
  ): Promise<{ meeting: Meeting; attendee: Attendee }> {
    const booking = await this.assertVideoBookingParticipant(
      userId,
      dto.bookingId,
    );
    this.assertWithinSessionWindow(booking);
    const meeting = await this.chimeService.ensureMeeting(
      dto.bookingId,
      booking.durationMinutes,
    );
    const attendee = await this.chimeService.createAttendee(
      dto.bookingId,
      userId,
      booking.durationMinutes,
    );
    return { meeting, attendee };
  }

  @Get(':bookingId')
  async getSession(
    @CurrentUser('sub') userId: string,
    @Param('bookingId') bookingId: string,
  ): Promise<{ meeting: Meeting; attendees: Record<string, Attendee> }> {
    await this.assertBookingParticipant(userId, bookingId);
    return this.chimeService.getMeeting(bookingId);
  }

  @Delete(':bookingId')
  async endSession(
    @CurrentUser('sub') userId: string,
    @Param('bookingId') bookingId: string,
  ): Promise<{ success: true }> {
    await this.assertBookingParticipant(userId, bookingId);
    await this.chimeService.endMeeting(bookingId);
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'completed' },
    });
    return { success: true };
  }

  private assertWithinSessionWindow(booking: Booking): void {
    const now = new Date();
    const windowStart = new Date(
      booking.startTime.getTime() - PRE_START_WINDOW_MS,
    );
    const windowEnd = new Date(booking.endTime.getTime());
    if (now < windowStart || now > windowEnd) {
      throw new BadRequestException(
        'Session not yet available or already expired',
      );
    }
  }

  private async assertVideoBookingParticipant(
    userId: string,
    bookingId: string,
  ): Promise<BookingWithPanditUser> {
    const booking = await this.assertBookingParticipant(userId, bookingId);

    if (booking.format !== 'video') {
      throw new BadRequestException('Booking format must be video');
    }

    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Booking status must be confirmed');
    }

    return booking;
  }

  private async assertBookingOwner(
    userId: string,
    bookingId: string,
  ): Promise<Booking> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    if (booking.format !== 'video') {
      throw new BadRequestException('Booking format must be video');
    }

    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Booking status must be confirmed');
    }

    return booking;
  }

  private async assertBookingParticipant(
    userId: string,
    bookingId: string,
  ): Promise<BookingWithPanditUser> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pandit: { select: { userId: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    const isParticipant =
      booking.userId === userId || booking.pandit.userId === userId;

    if (!isParticipant) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    return booking;
  }
}
