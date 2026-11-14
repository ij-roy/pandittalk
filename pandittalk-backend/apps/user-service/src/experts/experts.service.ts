import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Pandit, Prisma, Review, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildAreaWhere,
  resolveGuidanceAreasForFilter,
} from './expert-area-filter';
import type { ListExpertsQueryDto } from './dto/list-experts-query.dto';
import {
  publicReviewWhere,
  publicReviewerFirstName,
} from './public-reviews';
import { isPanditPresent } from './presence-fresh';

export interface Expert {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  price_per_session: number;
  rating: number;
  total_reviews: number;
  category: string;
  bio: string;
  languages: string[];
  image_url: string | null;
  isOnline: boolean;
}

export interface PanditPresence {
  id: string;
  isOnline: boolean;
}

export interface PanditMe {
  id: string;
  name: string;
  specialty: string;
  isOnline: boolean;
}

export interface ExpertListItem extends Expert {
  available_slots_today: number;
}

export interface ExpertSlot {
  id: string;
  date: string;
  duration_minutes: number;
  is_booked: boolean;
}

export interface ExpertReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_first_name: string | null;
}

export interface ExpertDetail extends Expert {
  slots: ExpertSlot[];
  reviews: ExpertReview[];
}

export type FollowedExpert = Expert & {
  is_verified: boolean;
  is_premium: boolean;
};

export type SlotDisplayStatus = 'available' | 'booked';

export interface SlotWithStatus {
  startTime: string;
  status: SlotDisplayStatus;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function slotAtIST(year: number, month: number, day: number, hour: number): Date {
  return new Date(
    `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:00:00+05:30`,
  );
}

function todayIST(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return { year: get('year'), month: get('month'), day: get('day') };
}

function ymdFromDateIST(date: Date): { year: number; month: number; day: number } {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  const [year, month, day] = ymd.split('-').map(Number);
  return { year, month, day };
}

function parseYmd(dateYmd: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateYmd.split('-').map(Number);
  return { year, month, day };
}

function timeAtIST(
  dateYmd: string,
  hour: number,
  minute: number,
): Date {
  const { year, month, day } = parseYmd(dateYmd);
  return new Date(
    `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:00+05:30`,
  );
}

function parseWindowTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

function dayOfWeekIST(dateYmd: string): number {
  const anchor = timeAtIST(dateYmd, 12, 0);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
  }).format(anchor);

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return map[weekday] ?? 0;
}

function dayRangeIST(dateYmd: string): { start: Date; end: Date } {
  const { year, month, day } = parseYmd(dateYmd);
  const start = slotAtIST(year, month, day, 0);
  const anchor = slotAtIST(year, month, day, 12);
  anchor.setUTCDate(anchor.getUTCDate() + 1);
  const next = ymdFromDateIST(anchor);
  const end = slotAtIST(next.year, next.month, next.day, 0);
  return { start, end };
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

const SLOT_STEP_MINUTES = 15;
const BOOKING_BUFFER_MINUTES = 5;
const DEFAULT_LIST_DURATION_MINUTES = 25;
/** Matches bookings.service: DEPTH_PRICES.standard + FORMAT_SURCHARGE.chat */
const PUBLIC_STANDARD_CHAT_PRICE = 251;

function mapPanditToExpert(
  pandit: Pandit,
  stats?: { rating: number; total_reviews: number },
): Expert {
  return {
    id: pandit.id,
    name: pandit.name,
    specialty: pandit.specialty,
    experience: pandit.experience,
    // Always expose checkout-aligned price — never seed marketing numbers.
    price_per_session: PUBLIC_STANDARD_CHAT_PRICE,
    // Always use filtered live review stats — never fall back to seeded pandit totals.
    rating: stats?.rating ?? 0,
    total_reviews: stats?.total_reviews ?? 0,
    category: pandit.category,
    bio: pandit.bio,
    languages: pandit.languages,
    image_url: pandit.imageUrl,
    isOnline: isPanditPresent(pandit),
  };
}

function mapReview(review: Review & { user: Pick<User, 'firstName'> }): ExpertReview {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.createdAt.toISOString(),
    user_first_name: publicReviewerFirstName(review.user.firstName),
  };
}

const EMPTY_REVIEW_STATS = { rating: 0, total_reviews: 0 };

@Injectable()
export class ExpertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<PanditMe> {
    const pandit = await this.prisma.pandit.findUnique({
      where: { userId },
      select: { id: true, name: true, specialty: true, isOnline: true, presenceSeenAt: true },
    });

    if (!pandit) {
      throw new NotFoundException(
        'No pandit profile linked to this user account',
      );
    }

    return {
      id: pandit.id,
      name: pandit.name,
      specialty: pandit.specialty,
      isOnline: isPanditPresent(pandit),
    };
  }

  async findAll(query: ListExpertsQueryDto = {}): Promise<ExpertListItem[]> {
    const today = todayIST();
    const dateYmd = `${today.year}-${pad2(today.month)}-${pad2(today.day)}`;

    const trimmedSearch = query.search?.trim() || undefined;
    const andClauses: Prisma.PanditWhereInput[] = [];

    if (trimmedSearch) {
      andClauses.push({
        OR: [
          { name: { contains: trimmedSearch, mode: 'insensitive' } },
          { specialty: { contains: trimmedSearch, mode: 'insensitive' } },
        ],
      });
    }

    if (query.area) {
      const guidanceAreas = resolveGuidanceAreasForFilter(query.area);
      if (guidanceAreas !== null) {
        andClauses.push(buildAreaWhere(guidanceAreas));
      }
    }

    const pandits = await this.prisma.pandit.findMany({
      where: andClauses.length > 0 ? { AND: andClauses } : undefined,
      orderBy: { name: 'asc' },
    });

    const reviewStats = pandits.length
      ? await this.prisma.review.groupBy({
          by: ['panditId'],
          where: publicReviewWhere({
            panditId: { in: pandits.map((pandit) => pandit.id) },
          }),
          _count: { _all: true },
          _avg: { rating: true },
        })
      : [];
    const statsByPanditId = new Map(
      reviewStats.map((row) => [
        row.panditId,
        {
          total_reviews: row._count._all,
          rating: row._avg.rating == null ? 0 : Number(row._avg.rating.toFixed(1)),
        },
      ]),
    );

    const items = await Promise.all(
      pandits.map(async (pandit) => {
        const slots = await this.computeAvailableSlots(
          pandit.id,
          dateYmd,
          DEFAULT_LIST_DURATION_MINUTES,
        );

        return {
          // Always use filtered live stats — never fall back to seeded pandit totals.
          ...mapPanditToExpert(
            pandit,
            statsByPanditId.get(pandit.id) ?? EMPTY_REVIEW_STATS,
          ),
          available_slots_today: slots.length,
        };
      }),
    );

    return items;
  }

  async updatePresence(
    userId: string,
    id: string,
    isOnline: boolean,
  ): Promise<PanditPresence> {
    const pandit = await this.prisma.pandit.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!pandit) {
      throw new NotFoundException(
        'No pandit profile linked to this user account',
      );
    }

    if (pandit.id !== id) {
      throw new ForbiddenException(
        'You can only update presence for your own pandit profile',
      );
    }

    try {
      const updated = await this.prisma.pandit.update({
        where: { id },
        data: {
          isOnline,
          presenceSeenAt: isOnline ? new Date() : null,
        },
        select: { id: true, isOnline: true },
      });

      return updated;
    } catch {
      throw new NotFoundException(`Expert with id "${id}" not found`);
    }
  }

  async findOne(id: string): Promise<ExpertDetail> {
    const pandit = await this.prisma.pandit.findUnique({
      where: { id },
      include: {
        reviews: {
          where: publicReviewWhere(),
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { firstName: true },
            },
          },
        },
      },
    });

    if (!pandit) {
      throw new NotFoundException(`Expert with id "${id}" not found`);
    }

    const { reviews, ...panditFields } = pandit;
    const reviewAggregate = await this.prisma.review.aggregate({
      where: publicReviewWhere({ panditId: id }),
      _count: { _all: true },
      _avg: { rating: true },
    });
    const totalReviews = reviewAggregate._count._all;
    const rating =
      reviewAggregate._avg.rating == null
        ? 0
        : Number(reviewAggregate._avg.rating.toFixed(1));

    const today = ymdFromDateIST(new Date());
    const dateYmd = `${today.year}-${pad2(today.month)}-${pad2(today.day)}`;
    const todaySlots = await this.computeAllSlots(
      id,
      dateYmd,
      DEFAULT_LIST_DURATION_MINUTES,
    );

    return {
      ...mapPanditToExpert(panditFields, {
        rating,
        total_reviews: totalReviews,
      }),
      slots: todaySlots.map((slot) => ({
        id: slot.startTime,
        date: slot.startTime,
        duration_minutes: DEFAULT_LIST_DURATION_MINUTES,
        is_booked: slot.status === 'booked',
      })),
      reviews: reviews.map(mapReview),
    };
  }

  async computeAllSlots(
    panditId: string,
    dateYmd: string,
    durationMinutes: number,
  ): Promise<SlotWithStatus[]> {
    const pandit = await this.prisma.pandit.findUnique({
      where: { id: panditId },
      select: { id: true },
    });

    if (!pandit) {
      throw new NotFoundException(`Expert with id "${panditId}" not found`);
    }

    const dayOfWeek = dayOfWeekIST(dateYmd);

    const availability = await this.prisma.panditAvailability.findFirst({
      where: {
        panditId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!availability) {
      return [];
    }

    const { start: dayStart, end: dayEnd } = dayRangeIST(dateYmd);

    const bookings = await this.prisma.booking.findMany({
      where: {
        panditId,
        status: { not: 'cancelled' },
        startTime: { gte: dayStart, lt: dayEnd },
      },
      select: {
        startTime: true,
        bufferEndTime: true,
      },
    });

    const windowStart = parseWindowTime(availability.windowStart);
    const windowEnd = parseWindowTime(availability.windowEnd);
    const windowStartAt = timeAtIST(
      dateYmd,
      windowStart.hour,
      windowStart.minute,
    );
    const windowEndAt = timeAtIST(dateYmd, windowEnd.hour, windowEnd.minute);

    const stepMs = SLOT_STEP_MINUTES * 60 * 1000;
    const durationMs = durationMinutes * 60 * 1000;
    const bufferMs = BOOKING_BUFFER_MINUTES * 60 * 1000;
    const now = new Date();
    const slots: SlotWithStatus[] = [];

    for (
      let cursor = windowStartAt.getTime();
      cursor < windowEndAt.getTime();
      cursor += stepMs
    ) {
      const startTime = new Date(cursor);
      const sessionEnd = new Date(cursor + durationMs);
      const slotBufferEnd = new Date(cursor + durationMs + bufferMs);

      if (slotBufferEnd > windowEndAt) {
        continue;
      }

      if (startTime <= now) {
        continue;
      }

      const blocked = bookings.some((booking) =>
        rangesOverlap(
          startTime,
          sessionEnd,
          booking.startTime,
          booking.bufferEndTime,
        ),
      );

      slots.push({
        startTime: startTime.toISOString(),
        status: blocked ? 'booked' : 'available',
      });
    }

    return slots;
  }

  async computeAvailableSlots(
    panditId: string,
    dateYmd: string,
    durationMinutes: number,
  ): Promise<string[]> {
    const all = await this.computeAllSlots(panditId, dateYmd, durationMinutes);
    return all
      .filter((slot) => slot.status === 'available')
      .map((slot) => slot.startTime);
  }

  async followPandit(
    userId: string,
    panditId: string,
  ): Promise<{ following: true }> {
    const pandit = await this.prisma.pandit.findUnique({
      where: { id: panditId },
      select: { id: true },
    });
    if (!pandit) {
      throw new NotFoundException('Pandit not found');
    }

    await this.prisma.panditFollow.upsert({
      where: { userId_panditId: { userId, panditId } },
      create: { userId, panditId },
      update: {},
    });
    return { following: true };
  }

  async unfollowPandit(
    userId: string,
    panditId: string,
  ): Promise<{ following: false }> {
    await this.prisma.panditFollow.deleteMany({
      where: { userId, panditId },
    });
    return { following: false };
  }

  async isFollowing(
    userId: string,
    panditId: string,
  ): Promise<{ following: boolean }> {
    const row = await this.prisma.panditFollow.findUnique({
      where: { userId_panditId: { userId, panditId } },
      select: { userId: true },
    });
    return { following: row != null };
  }

  async listFollowing(userId: string): Promise<FollowedExpert[]> {
    const follows = await this.prisma.panditFollow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { pandit: true },
    });
    const pandits = follows.map((row) => row.pandit);
    if (pandits.length === 0) return [];

    const reviewStats = await this.prisma.review.groupBy({
      by: ['panditId'],
      where: publicReviewWhere({
        panditId: { in: pandits.map((pandit) => pandit.id) },
      }),
      _count: { _all: true },
      _avg: { rating: true },
    });
    const statsByPanditId = new Map(
      reviewStats.map((row) => [
        row.panditId,
        {
          total_reviews: row._count._all,
          rating:
            row._avg.rating == null ? 0 : Number(row._avg.rating.toFixed(1)),
        },
      ]),
    );

    return pandits.map((pandit) => ({
      ...mapPanditToExpert(
        pandit,
        statsByPanditId.get(pandit.id) ?? EMPTY_REVIEW_STATS,
      ),
      is_verified: pandit.isVerified,
      is_premium: pandit.isPremium,
    }));
  }
}
