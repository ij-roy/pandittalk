import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  type Booking,
  type Pandit,
  type Review,
  TransactionStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import {
  assertAvBookingAllowed,
  type ClientPlatform,
} from '../common/client-platform';
import { PanditBusyException } from './exceptions/pandit-busy.exception';
import { ledgerRefundWrite } from './ledger-copy';
import { PanditAvailabilityService } from './pandit-availability.service';
import { PanditQueueService } from './pandit-queue.service';
import { publicReviewWhere } from '../experts/public-reviews';
import { isAtLeastAge, MINIMUM_ACCOUNT_AGE } from '../lib/age';
import { isPanditPresent } from '../experts/presence-fresh';

import type {
  BookingDepth,
  BookingFormat,
  BookingSessionModel,
} from './dto/create-booking.dto';
import type { ChatNowDto } from './dto/create-chat-now.dto';
import type { BookingStatusUpdate } from './dto/update-booking-status.dto';

const AGE_GATE_MARKETPLACE_MESSAGE =
  'Confirm your date of birth in Profile (you must be 18+) before booking or chatting.';

const DEPTH_PRICES: Record<BookingDepth, number> = {
  entry: 151,

  standard: 301,

  deep: 501,
};

const FORMAT_SURCHARGE: Record<BookingFormat, number> = {
  video: 150,

  audio: 0,

  chat: -50,
};

const DEPTH_DURATION_MINUTES: Record<BookingDepth, number> = {
  entry: 15,

  standard: 25,

  deep: 45,
};

const BOOKING_BUFFER_MINUTES = 5;

const CHAT_NOW_PRICE = 101;
const CHAT_NOW_DURATION_MINUTES = 15;
const CHAT_NOW_BUFFER_MINUTES = 5;

export interface BookingListItem {
  id: string;

  panditId: string;

  panditName: string;

  startTime: string;

  status: string;

  format: string;

  sessionModel: string;

  area: string;

  depth: string;

  durationMinutes: number;

  coinsDeducted: number;

  totalPrice: number;

  notes: string | null;

  createdAt: string;

  review: { id: string; rating: number; comment: string | null } | null;
}

export interface BookingReviewSummary {
  id: string;

  rating: number;

  comment: string | null;

  createdAt: string;
}

export interface BookingPanditDetail {
  id: string;

  name: string;

  headline: string;

  specialty: string;

  imageUrl: string | null;

  rating: number;
}

export interface BookingDetail {
  id: string;

  userId: string;

  panditId: string;

  area: string;

  depth: string;

  format: string;

  sessionModel: string;

  durationMinutes: number;

  startTime: string;

  endTime: string;

  bufferEndTime: string;

  totalPrice: number;

  coinsDeducted: number;

  status: string;

  notes: string | null;

  createdAt: string;

  updatedAt: string;

  pandit: BookingPanditDetail;

  review: BookingReviewSummary | null;
}

export interface CreatedBookingResponse {
  sessionModel: string;
  id: string;
  userId: string;

  panditId: string;

  area: string;

  depth: string;

  format: string;

  durationMinutes: number;

  totalPrice: number;

  coinsDeducted: number;

  status: string;

  createdAt: string;

  panditName: string;

  startTime: string;
}

export interface BookingUserDetails {
  userId: string;
  userName: string | null;
  /** Never exposed to pandits — kept null for privacy. */
  phoneNumber: null;
  dob: string | null;
  placeOfBirth: string | null;
  zodiacSign: string | null;
  maritalStatus: string | null;
  gender: string | null;
  profileCompleted: boolean;
}

export interface SharedBookingContext {
  id: string;
  text: string;
  version: number;
  sharedAt: string;
  contextVersion: number;
}

export interface RefundResult {
  coinsRefunded: number;
  booking: Booking;
  applied: boolean;
}

function calculateTotalPrice(
  depth: BookingDepth,
  format: BookingFormat,
): number {
  return DEPTH_PRICES[depth] + FORMAT_SURCHARGE[format];
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly panditAvailability: PanditAvailabilityService,
    private readonly panditQueue: PanditQueueService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,

    panditId: string,

    startTimeIso: string,

    area: string,

    depth: BookingDepth,

    format: BookingFormat,

    notes?: string,

    sessionModel: BookingSessionModel = 'legacy_timed',

    platform: ClientPlatform = 'unknown',
  ): Promise<CreatedBookingResponse> {
    // App Store Option C: reopen scheduled bookings. Browser-native WebRTC
    // supports the same audio/video booking contract on web and native clients.
    const newBookingsEnabled = true;
    if (!newBookingsEnabled) {
      throw new ServiceUnavailableException(
        'New bookings are temporarily unavailable. You will not be charged. Existing bookings remain available.',
      );
    }

    if (format === 'audio' || format === 'video') {
      assertAvBookingAllowed(platform);
    }

    if (sessionModel === 'no_timer') {
      throw new BadRequestException(
        'The No Timer service policy is not enabled for this backend. Existing bookings retain legacy terms.',
      );
    }

    const startTime = new Date(startTimeIso);

    if (Number.isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid startTime');
    }

    const pandit = await this.prisma.pandit.findUnique({
      where: { id: panditId },

      select: { name: true },
    });

    if (!pandit) {
      throw new BadRequestException('Pandit not found');
    }

    const totalPrice = calculateTotalPrice(depth, format);

    const coinsDeducted = totalPrice;

    const durationMinutes = DEPTH_DURATION_MINUTES[depth];

    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const bufferEndTime = new Date(
      endTime.getTime() + BOOKING_BUFFER_MINUTES * 60 * 1000,
    );

    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },

      select: { walletBalance: true, dob: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.assertAdultDob(user.dob);

    if (Number(user.walletBalance) < totalPrice) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          panditId,

          status: { not: 'cancelled' },

          startTime: { lt: bufferEndTime },

          endTime: { gt: startTime },
        },
      });

      if (conflict) {
        throw new ConflictException({
          code: 'SLOT_TAKEN',
          message:
            'That time was just taken. Please choose another available slot.',
        });
      }

      const walletUpdate = await tx.user.updateMany({
        where: {
          id: userId,

          isActive: true,

          walletBalance: { gte: totalPrice },
        },

        data: {
          walletBalance: { decrement: totalPrice },
        },
      });

      if (walletUpdate.count === 0) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      return tx.booking.create({
        data: {
          userId,

          panditId,

          area,

          depth,

          format,

          sessionModel,

          durationMinutes,

          startTime,

          endTime,

          bufferEndTime,

          totalPrice,

          coinsDeducted,

          notes: notes ?? null,
        },
      });
    });

    await this.prisma.transaction.create({
      data: {
        userId,

        type: 'booking_debit',

        status: TransactionStatus.SUCCESS,

        coinsAmount: booking.coinsDeducted,

        amountInr: booking.totalPrice,

        bookingId: booking.id,

        description: `Session booking: ${area} with ${pandit.name}`,
      },
    });

    await this.notifyBookingConfirmed(
      userId,
      booking.id,
      pandit.name,
      area,
      startTime,
    );

    return this.toCreatedResponse(booking, pandit.name);
  }

  async createChatNow(
    userId: string,
    dto: ChatNowDto,
  ): Promise<CreatedBookingResponse> {
    const newInstantChatsEnabled = true;
    if (!newInstantChatsEnabled) {
      throw new ServiceUnavailableException(
        'Instant chat is temporarily unavailable. You will not be charged. Existing bookings remain available.',
      );
    }

    const pandit = await this.prisma.pandit.findUnique({
      where: { id: dto.panditId },
      select: { name: true, isOnline: true, presenceSeenAt: true },
    });

    if (!pandit) {
      throw new NotFoundException('Pandit not found');
    }

    if (!isPanditPresent(pandit)) {
      throw new BadRequestException('Pandit is offline');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, dob: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.assertAdultDob(user.dob);

    if (Number(user.walletBalance) < CHAT_NOW_PRICE) {
      throw new BadRequestException('Insufficient balance');
    }

    const now = new Date();
    const liveStatus = await this.panditAvailability.getLiveStatus(
      dto.panditId,
    );

    if (liveStatus.state === 'busy') {
      throw new PanditBusyException({
        code: 'PANDIT_BUSY',
        message: 'Pandit is currently on another call.',
        estimatedAvailableAt: liveStatus.estimatedAvailableAt,
        queueLength: liveStatus.queueLength,
        canJoinQueue: liveStatus.canJoinQueue,
      });
    }

    const endTime = new Date(
      now.getTime() + CHAT_NOW_DURATION_MINUTES * 60 * 1000,
    );
    const bufferEndTime = new Date(
      endTime.getTime() + CHAT_NOW_BUFFER_MINUTES * 60 * 1000,
    );

    const booking = await this.prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          panditId: dto.panditId,
          status: 'confirmed',
          startTime: { lte: now },
          endTime: { gte: now },
        },
      });

      if (conflict) {
        const status = await this.panditAvailability.getLiveStatus(
          dto.panditId,
        );
        throw new PanditBusyException({
          code: 'PANDIT_BUSY',
          message: 'Pandit is currently on another call.',
          estimatedAvailableAt: status.estimatedAvailableAt,
          queueLength: status.queueLength,
          canJoinQueue: status.canJoinQueue,
        });
      }

      const walletUpdate = await tx.user.updateMany({
        where: { id: userId, isActive: true, walletBalance: { gte: 101 } },
        data: { walletBalance: { decrement: 101 } },
      });

      if (walletUpdate.count === 0) {
        throw new BadRequestException('Insufficient balance');
      }

      const newBooking = await tx.booking.create({
        data: {
          userId,
          panditId: dto.panditId,
          area: dto.area,
          depth: 'entry',
          format: 'chat',
          durationMinutes: CHAT_NOW_DURATION_MINUTES,
          startTime: now,
          endTime,
          bufferEndTime,
          totalPrice: CHAT_NOW_PRICE,
          coinsDeducted: 101,
          status: 'confirmed',
          notes: dto.notes ?? null,
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'booking_debit',
          status: TransactionStatus.SUCCESS,
          coinsAmount: 101,
          amountInr: newBooking.totalPrice,
          bookingId: newBooking.id,
          description: 'Chat Now Session',
        },
      });

      return newBooking;
    });

    await this.panditQueue.removeUserFromQueue(userId, dto.panditId);
    await this.panditQueue.clearTurn(dto.panditId);

    this.chatGateway.emitNewBookingCreated({
      bookingId: booking.id,
      panditId: dto.panditId,
      area: dto.area,
    });

    await this.notifyBookingConfirmed(
      userId,
      booking.id,
      pandit.name,
      dto.area,
      booking.startTime,
    );

    return this.toCreatedResponse(booking, pandit.name);
  }

  async findAllForUser(userId: string): Promise<BookingListItem[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },

      orderBy: { createdAt: 'desc' },

      include: {
        pandit: { select: { name: true } },

        review: { select: { id: true, rating: true, comment: true } },
      },
    });

    return bookings.map((booking) => ({
      id: booking.id,

      panditId: booking.panditId,

      panditName: booking.pandit.name,

      startTime: booking.startTime.toISOString(),

      status: booking.status,

      format: booking.format,

      sessionModel: booking.sessionModel,

      area: booking.area,

      depth: booking.depth,

      durationMinutes: booking.durationMinutes,

      coinsDeducted: booking.coinsDeducted,

      totalPrice: Number(booking.totalPrice),

      notes: booking.notes,

      createdAt: booking.createdAt.toISOString(),

      review: booking.review
        ? {
            id: booking.review.id,
            rating: booking.review.rating,
            comment: booking.review.comment,
          }
        : null,
    }));
  }

  async findAllForPanditUser(userId: string): Promise<BookingListItem[]> {
    const pandit = await this.prisma.pandit.findUnique({
      where: { userId },

      select: { id: true },
    });

    if (!pandit) {
      throw new NotFoundException(
        'No pandit profile linked to this user account',
      );
    }

    const bookings = await this.prisma.booking.findMany({
      where: { panditId: pandit.id },

      orderBy: { createdAt: 'desc' },

      include: {
        pandit: { select: { name: true } },
      },
    });

    return bookings.map((booking) => ({
      id: booking.id,

      panditId: booking.panditId,

      panditName: booking.pandit.name,

      startTime: booking.startTime.toISOString(),

      status: booking.status,

      format: booking.format,

      sessionModel: booking.sessionModel,

      area: booking.area,

      depth: booking.depth,

      durationMinutes: booking.durationMinutes,

      coinsDeducted: booking.coinsDeducted,

      totalPrice: Number(booking.totalPrice),

      notes: booking.notes,

      createdAt: booking.createdAt.toISOString(),

      review: null,
    }));
  }

  async findOneForUser(
    userId: string,
    bookingId: string,
  ): Promise<BookingDetail> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },

      include: {
        pandit: {
          select: {
            id: true,

            name: true,

            headline: true,

            specialty: true,

            imageUrl: true,

            rating: true,
          },
        },

        review: {
          select: {
            id: true,

            rating: true,

            comment: true,

            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    return this.toDetail(booking);
  }

  async findSharedContext(
    userId: string,
    bookingId: string,
  ): Promise<SharedBookingContext[]> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId },
      include: {
        pandit: { select: { userId: true } },
        contextShares: {
          where: { revokedAt: null },
          include: { context: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (
      !booking ||
      (booking.userId !== userId && booking.pandit.userId !== userId)
    ) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }
    return booking.contextShares
      .filter((share) => !share.context.deletedAt)
      .map((share) => ({
        id: share.context.id,
        text: share.context.text,
        version: share.context.version,
        sharedAt: share.createdAt.toISOString(),
        contextVersion: share.contextVersion,
      }));
  }

  async reschedule(
    userId: string,
    bookingId: string,
    startTimeIso: string,
  ): Promise<BookingDetail> {
    const startTime = new Date(startTimeIso);
    const minLeadMs = 15 * 60 * 1000;
    if (
      Number.isNaN(startTime.getTime()) ||
      startTime.getTime() < Date.now() + minLeadMs
    ) {
      throw new BadRequestException(
        'Choose a time at least 15 minutes from now.',
      );
    }

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }
    if (booking.status !== 'confirmed') {
      throw new BadRequestException(
        'Only upcoming confirmed sessions can be rescheduled.',
      );
    }
    if (booking.startTime.getTime() - Date.now() < minLeadMs) {
      throw new BadRequestException(
        'This session starts too soon to reschedule. Cancel it if you cannot attend.',
      );
    }

    const depth = booking.depth as BookingDepth;
    const durationMinutes = DEPTH_DURATION_MINUTES[depth];
    if (!durationMinutes) {
      throw new BadRequestException('This session cannot be rescheduled.');
    }

    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    const bufferEndTime = new Date(
      endTime.getTime() + BOOKING_BUFFER_MINUTES * 60 * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          id: { not: bookingId },
          panditId: booking.panditId,
          status: { not: 'cancelled' },
          startTime: { lt: bufferEndTime },
          endTime: { gt: startTime },
        },
      });
      if (conflict) {
        throw new ConflictException('Slot no longer available');
      }
      await tx.booking.update({
        where: { id: bookingId },
        data: { startTime, endTime },
      });
    });

    return this.findOneForUser(userId, bookingId);
  }

  async updateStatus(
    userId: string,

    bookingId: string,

    status: BookingStatusUpdate,
  ): Promise<BookingDetail> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    if (booking.status === status) {
      return this.findOneForUser(userId, bookingId);
    }

    if (status === 'cancelled') {
      await this.cancelWithRefund(bookingId, 'Refund: cancelled session');
    } else {
      await this.prisma.booking.update({
        where: { id: bookingId },

        data: { status },
      });
    }

    return this.findOneForUser(userId, bookingId);
  }

  /** Pandit-initiated cancel with full wallet refund (same path as user cancel). */
  async cancelForPanditUser(
    panditUserId: string,
    bookingId: string,
  ): Promise<BookingDetail> {
    const pandit = await this.prisma.pandit.findUnique({
      where: { userId: panditUserId },
      select: { id: true },
    });
    if (!pandit) {
      throw new NotFoundException(
        'No pandit profile linked to this user account',
      );
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }
    if (booking.panditId !== pandit.id) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }
    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed bookings can be cancelled');
    }

    await this.cancelWithRefund(bookingId, 'Refund: cancelled by pandit');

    const detail = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pandit: {
          select: {
            id: true,
            name: true,
            headline: true,
            specialty: true,
            imageUrl: true,
            rating: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });
    if (!detail) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }
    return this.toDetail(detail);
  }

  async cancelWithRefund(
    bookingId: string,
    description: string,
  ): Promise<RefundResult> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    if (booking.status !== 'confirmed') {
      return { coinsRefunded: 0, booking, applied: false };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'cancelled' },
      });

      await tx.user.update({
        where: { id: booking.userId },
        data: { walletBalance: { increment: booking.coinsDeducted } },
      });

      const ledger = ledgerRefundWrite('full', description);
      await tx.transaction.create({
        data: {
          userId: booking.userId,
          type: ledger.type,
          status: TransactionStatus.SUCCESS,
          coinsAmount: booking.coinsDeducted,
          amountInr: null,
          bookingId: booking.id,
          description: ledger.description,
        },
      });

      return tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
    });

    return {
      coinsRefunded: booking.coinsDeducted,
      booking: updated,
      applied: true,
    };
  }

  async partialRefundAndComplete(
    bookingId: string,
    refundCoins: number,
    description: string,
  ): Promise<RefundResult> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    if (booking.status !== 'confirmed') {
      return { coinsRefunded: 0, booking, applied: false };
    }

    if (refundCoins <= 0) {
      const updated = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'completed' },
      });
      return { coinsRefunded: 0, booking: updated, applied: true };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'completed' },
      });

      await tx.user.update({
        where: { id: booking.userId },
        data: { walletBalance: { increment: refundCoins } },
      });

      const ledger = ledgerRefundWrite('partial', description);
      await tx.transaction.create({
        data: {
          userId: booking.userId,
          type: ledger.type,
          status: TransactionStatus.SUCCESS,
          coinsAmount: refundCoins,
          amountInr: null,
          bookingId: booking.id,
          description: ledger.description,
        },
      });

      return tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
    });

    return { coinsRefunded: refundCoins, booking: updated, applied: true };
  }

  async markCompleted(bookingId: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    if (booking.status !== 'confirmed') {
      return booking;
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'completed' },
    });
  }

  async setPanditOffline(panditId: string): Promise<void> {
    await this.prisma.pandit.update({
      where: { id: panditId },
      data: { isOnline: false, presenceSeenAt: null },
    });
  }

  async findUserDetailsForPandit(
    panditUserId: string,
    bookingId: string,
  ): Promise<BookingUserDetails> {
    const pandit = await this.prisma.pandit.findUnique({
      where: { userId: panditUserId },
      select: { id: true },
    });

    if (!pandit) {
      throw new NotFoundException(
        'No pandit profile linked to this user account',
      );
    }

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, panditId: pandit.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            dob: true,
            placeOfBirth: true,
            zodiacSign: true,
            maritalStatus: true,
            gender: true,
            profileCompleted: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    return {
      userId: booking.user.id,
      userName: booking.user.name,
      // Seekers' mobile numbers are never disclosed to pandits.
      phoneNumber: null,
      dob: booking.user.dob,
      placeOfBirth: booking.user.placeOfBirth,
      zodiacSign: booking.user.zodiacSign,
      maritalStatus: booking.user.maritalStatus,
      gender: booking.user.gender,
      profileCompleted: booking.user.profileCompleted,
    };
  }

  async createReview(
    userId: string,

    bookingId: string,

    rating: number,

    comment?: string,
  ): Promise<BookingReviewSummary> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, userId },

      include: { review: { select: { id: true } } },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    if (booking.status !== 'completed') {
      throw new BadRequestException('Only completed bookings can be reviewed');
    }

    if (booking.review) {
      throw new ConflictException('A review already exists for this booking');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          bookingId,

          userId,

          panditId: booking.panditId,

          rating,

          comment: comment ?? null,
        },
      });

      const aggregate = await tx.review.aggregate({
        where: publicReviewWhere({ panditId: booking.panditId }),

        _avg: { rating: true },

        _count: true,
      });

      const avgRating =
        Math.round((aggregate._avg.rating ?? rating) * 100) / 100;

      await tx.pandit.update({
        where: { id: booking.panditId },

        data: {
          rating: avgRating,

          totalReviews: aggregate._count,
        },
      });

      return created;
    });

    return {
      id: review.id,

      rating: review.rating,

      comment: review.comment,

      createdAt: review.createdAt.toISOString(),
    };
  }

  private assertAdultDob(dob: string | null | undefined): void {
    if (!dob || !isAtLeastAge(dob, MINIMUM_ACCOUNT_AGE)) {
      throw new ForbiddenException(AGE_GATE_MARKETPLACE_MESSAGE);
    }
  }

  private toCreatedResponse(
    booking: Booking,

    panditName: string,
  ): CreatedBookingResponse {
    return {
      id: booking.id,

      userId: booking.userId,

      panditId: booking.panditId,

      area: booking.area,

      depth: booking.depth,

      format: booking.format,

      sessionModel: booking.sessionModel,

      durationMinutes: booking.durationMinutes,

      totalPrice: Number(booking.totalPrice),

      coinsDeducted: booking.coinsDeducted,

      status: booking.status,

      createdAt: booking.createdAt.toISOString(),

      panditName,

      startTime: booking.startTime.toISOString(),
    };
  }

  private toDetail(
    booking: Booking & {
      pandit: Pick<
        Pandit,
        'id' | 'name' | 'headline' | 'specialty' | 'imageUrl' | 'rating'
      >;

      review: Pick<Review, 'id' | 'rating' | 'comment' | 'createdAt'> | null;
    },
  ): BookingDetail {
    return {
      id: booking.id,

      userId: booking.userId,

      panditId: booking.panditId,

      area: booking.area,

      depth: booking.depth,

      format: booking.format,

      sessionModel: booking.sessionModel,

      durationMinutes: booking.durationMinutes,

      startTime: booking.startTime.toISOString(),

      endTime: booking.endTime.toISOString(),

      bufferEndTime: booking.bufferEndTime.toISOString(),

      totalPrice: Number(booking.totalPrice),

      coinsDeducted: booking.coinsDeducted,

      status: booking.status,

      notes: booking.notes,

      createdAt: booking.createdAt.toISOString(),

      updatedAt: booking.updatedAt.toISOString(),

      pandit: {
        id: booking.pandit.id,

        name: booking.pandit.name,

        headline: booking.pandit.headline,

        specialty: booking.pandit.specialty,

        imageUrl: booking.pandit.imageUrl,

        rating: Number(booking.pandit.rating),
      },

      review: booking.review
        ? {
            id: booking.review.id,

            rating: booking.review.rating,

            comment: booking.review.comment,

            createdAt: booking.review.createdAt.toISOString(),
          }
        : null,
    };
  }

  private async notifyBookingConfirmed(
    userId: string,
    bookingId: string,
    panditName: string,
    area: string,
    startTime: Date,
  ): Promise<void> {
    const formattedTime = startTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await this.notificationsService.createNotification(
      userId,
      'booking_confirmed',
      'Booking confirmed',
      `Your ${area} session with ${panditName} is confirmed for ${formattedTime}.`,
      bookingId,
    );
  }
}
