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
import { AudioSessionDto } from './dto/audio-session.dto';
import {
  WebRtcService,
  type WebRtcSessionConfig,
} from '../webrtc/webrtc.service';

type BookingWithPanditUser = Booking & {
  pandit: { userId: string | null };
};

const PRE_START_WINDOW_MS = 15 * 60 * 1000;

@Controller('sessions/audio')
@UseGuards(JwtAuthGuard)
export class AudioSessionController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webRtcService: WebRtcService,
  ) {}

  @Post('create')
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: AudioSessionDto,
  ): Promise<WebRtcSessionConfig> {
    const booking = await this.assertBookingOwner(userId, dto.bookingId);
    this.assertWithinSessionWindow(booking);
    return this.webRtcService.getSessionConfig(dto.bookingId, 'audio');
  }

  @Post('join')
  async join(
    @CurrentUser('sub') userId: string,
    @Body() dto: AudioSessionDto,
  ): Promise<WebRtcSessionConfig> {
    const booking = await this.assertAudioBookingParticipant(
      userId,
      dto.bookingId,
    );
    this.assertWithinSessionWindow(booking);
    return this.webRtcService.getSessionConfig(dto.bookingId, 'audio');
  }

  @Get(':bookingId')
  async getSession(
    @CurrentUser('sub') userId: string,
    @Param('bookingId') bookingId: string,
  ): Promise<WebRtcSessionConfig> {
    await this.assertBookingParticipant(userId, bookingId);
    return this.webRtcService.getSessionConfig(bookingId, 'audio');
  }

  @Delete(':bookingId')
  async endSession(
    @CurrentUser('sub') userId: string,
    @Param('bookingId') bookingId: string,
  ): Promise<{ success: true }> {
    await this.assertBookingParticipant(userId, bookingId);
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

  private async assertAudioBookingParticipant(
    userId: string,
    bookingId: string,
  ): Promise<BookingWithPanditUser> {
    const booking = await this.assertBookingParticipant(userId, bookingId);

    if (booking.format !== 'audio') {
      throw new BadRequestException('Booking format must be audio');
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

    if (booking.format !== 'audio') {
      throw new BadRequestException('Booking format must be audio');
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
