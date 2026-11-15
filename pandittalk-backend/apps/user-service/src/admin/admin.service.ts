import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ArticleStatus, Prisma, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isUserRole } from '../auth/types/user-role';
import {
  ADMIN_BOOKING_STATUSES,
  AdminBookingStatus,
} from './dto/update-admin-booking.dto';
import {
  ADMIN_APPLICATION_STATUSES,
  AdminApplicationStatus,
} from './dto/update-admin-application.dto';
import { AdminQueryDto } from './dto/admin-query.dto';

type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

const bookingTransitions: Record<string, readonly string[]> = {
  confirmed: ADMIN_BOOKING_STATUSES,
  completed: ['completed'],
  cancelled: ['cancelled'],
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      users,
      pandits,
      bookings,
      confirmedBookings,
      publishedArticles,
      transactions,
      pendingApplications,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.pandit.count(),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'confirmed' } }),
      this.prisma.article.count({ where: { status: ArticleStatus.published } }),
      this.prisma.transaction.count(),
      this.prisma.panditApplication.count({ where: { status: 'received' } }),
    ]);

    return {
      users,
      pandits,
      bookings,
      confirmedBookings,
      publishedArticles,
      transactions,
      pendingApplications,
    };
  }

  async listUsers(query: AdminQueryDto): Promise<Page<unknown>> {
    const where: Prisma.UserWhereInput = {};
    if (query.role && isUserRole(query.role)) {
      where.role = query.role;
    }
    if (query.search) {
      where.OR = [
        { phoneNumber: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = this.pagination(query);
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          phoneNumber: true,
          name: true,
          role: true,
          isActive: true,
          profileCompleted: true,
          createdAt: true,
          pandit: { select: { id: true, name: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return this.page(items, total, query);
  }

  async listPandits(query: AdminQueryDto): Promise<Page<unknown>> {
    const where: Prisma.PanditWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { specialty: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = this.pagination(query);
    const [items, total] = await Promise.all([
      this.prisma.pandit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          name: true,
          specialty: true,
          isVerified: true,
          isOnline: true,
          rating: true,
          totalReviews: true,
          createdAt: true,
          user: {
            select: { id: true, phoneNumber: true, isActive: true, role: true },
          },
        },
      }),
      this.prisma.pandit.count({ where }),
    ]);
    return this.page(items, total, query);
  }

  async listBookings(query: AdminQueryDto): Promise<Page<unknown>> {
    const where: Prisma.BookingWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.format) where.format = query.format;
    if (query.search) {
      where.OR = [
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        { pandit: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    const { skip, take } = this.pagination(query);
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip,
        take,
        select: {
          id: true,
          format: true,
          status: true,
          area: true,
          startTime: true,
          endTime: true,
          totalPrice: true,
          createdAt: true,
          user: { select: { id: true, name: true, phoneNumber: true } },
          pandit: { select: { id: true, name: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return this.page(items, total, query);
  }

  async updateBookingStatus(
    bookingId: string,
    status: AdminBookingStatus,
  ): Promise<unknown> {
    if (!ADMIN_BOOKING_STATUSES.includes(status)) {
      throw new BadRequestException('Unsupported booking status');
    }
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, status: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (!bookingTransitions[booking.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot change booking from ${booking.status} to ${status}`,
      );
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      select: {
        id: true,
        format: true,
        status: true,
        area: true,
        startTime: true,
        endTime: true,
        totalPrice: true,
        user: { select: { id: true, name: true, phoneNumber: true } },
        pandit: { select: { id: true, name: true } },
      },
    });
  }

  async listApplications(query: AdminQueryDto): Promise<Page<unknown>> {
    const where: Prisma.PanditApplicationWhereInput = query.status
      ? { status: query.status }
      : {};
    const { skip, take } = this.pagination(query);
    const [items, total] = await Promise.all([
      this.prisma.panditApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.panditApplication.count({ where }),
    ]);
    return this.page(items, total, query);
  }

  async updateApplicationStatus(
    applicationId: string,
    status: AdminApplicationStatus,
  ): Promise<unknown> {
    if (!ADMIN_APPLICATION_STATUSES.includes(status)) {
      throw new BadRequestException('Unsupported application status');
    }
    const application = await this.prisma.panditApplication.findUnique({
      where: { id: applicationId },
      select: { id: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    return this.prisma.panditApplication.update({
      where: { id: applicationId },
      data: { status },
    });
  }

  async listArticles(query: AdminQueryDto): Promise<Page<unknown>> {
    const where: Prisma.ArticleWhereInput = {};
    if (
      query.status &&
      Object.values(ArticleStatus).includes(query.status as ArticleStatus)
    ) {
      where.status = query.status as ArticleStatus;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const { skip, take } = this.pagination(query);
    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          category: true,
          author: true,
          updatedAt: true,
          publishedAt: true,
          authorPandit: { select: { id: true, name: true } },
        },
      }),
      this.prisma.article.count({ where }),
    ]);
    return this.page(items, total, query);
  }

  async listNotifications(query: AdminQueryDto): Promise<Page<unknown>> {
    const { skip, take } = this.pagination(query);
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          isRead: true,
          createdAt: true,
          user: { select: { id: true, name: true, phoneNumber: true } },
        },
      }),
      this.prisma.notification.count(),
    ]);
    return this.page(items, total, query);
  }

  async listTransactions(query: AdminQueryDto): Promise<Page<unknown>> {
    const where: Prisma.TransactionWhereInput = {};
    if (
      query.status &&
      Object.values(TransactionStatus).includes(
        query.status as TransactionStatus,
      )
    ) {
      where.status = query.status as TransactionStatus;
    }
    const { skip, take } = this.pagination(query);
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          type: true,
          coinsAmount: true,
          amountInr: true,
          status: true,
          description: true,
          createdAt: true,
          user: { select: { id: true, name: true, phoneNumber: true } },
          booking: { select: { id: true, format: true, status: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return this.page(items, total, query);
  }

  async listReports(query: AdminQueryDto): Promise<Page<unknown>> {
    const { skip, take } = this.pagination(query);
    const [items, total] = await Promise.all([
      this.prisma.savedReport.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          type: true,
          title: true,
          inputSummary: true,
          coinsSpent: true,
          createdAt: true,
          user: { select: { id: true, name: true, phoneNumber: true } },
        },
      }),
      this.prisma.savedReport.count(),
    ]);
    return this.page(items, total, query);
  }

  private pagination(query: AdminQueryDto): { skip: number; take: number } {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 20));
    return { skip: (page - 1) * pageSize, take: pageSize };
  }

  private page<T>(items: T[], total: number, query: AdminQueryDto): Page<T> {
    return {
      items,
      page: Math.max(1, query.page || 1),
      pageSize: Math.min(50, Math.max(1, query.pageSize || 20)),
      total,
    };
  }
}
