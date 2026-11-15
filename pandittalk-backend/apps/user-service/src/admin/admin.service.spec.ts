import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';

function createPrisma() {
  return {
    user: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([]),
    },
    pandit: {
      count: jest.fn().mockResolvedValue(2),
    },
    booking: {
      count: jest.fn().mockResolvedValue(3),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    article: {
      count: jest.fn().mockResolvedValue(4),
      findMany: jest.fn().mockResolvedValue([]),
    },
    transaction: {
      count: jest.fn().mockResolvedValue(5),
      findMany: jest.fn().mockResolvedValue([]),
    },
    panditApplication: {
      count: jest.fn().mockResolvedValue(6),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: { findMany: jest.fn().mockResolvedValue([]) },
    savedReport: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('AdminService', () => {
  it('returns overview counts from the management tables', async () => {
    const prisma = createPrisma();
    const service = new AdminService(prisma as never);

    await expect(service.getOverview()).resolves.toEqual({
      users: 1,
      pandits: 2,
      bookings: 3,
      confirmedBookings: 3,
      publishedArticles: 4,
      transactions: 5,
      pendingApplications: 6,
    });
  });

  it('returns bounded paginated users', async () => {
    const prisma = createPrisma();
    prisma.user.findMany.mockResolvedValue([{ id: 'user-1' }]);
    prisma.user.count.mockResolvedValue(7);
    const service = new AdminService(prisma as never);

    await expect(
      service.listUsers({ page: 2, pageSize: 5, search: 'local' }),
    ).resolves.toEqual({
      items: [{ id: 'user-1' }],
      page: 2,
      pageSize: 5,
      total: 7,
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
  });

  it('rejects an unknown booking status target', async () => {
    const prisma = createPrisma();
    const service = new AdminService(prisma as never);

    await expect(
      service.updateBookingStatus('booking-1', 'pending' as never),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.booking.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an unknown booking ID', async () => {
    const prisma = createPrisma();
    prisma.booking.findUnique.mockResolvedValue(null);
    const service = new AdminService(prisma as never);

    await expect(
      service.updateBookingStatus('booking-1', 'completed'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an unknown application status target', async () => {
    const prisma = createPrisma();
    const service = new AdminService(prisma as never);

    await expect(
      service.updateApplicationStatus('application-1', 'pending' as never),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.panditApplication.findUnique).not.toHaveBeenCalled();
  });

  it('updates an existing application status', async () => {
    const prisma = createPrisma();
    prisma.panditApplication.findUnique.mockResolvedValue({
      id: 'application-1',
      status: 'received',
    });
    prisma.panditApplication.update.mockResolvedValue({
      id: 'application-1',
      status: 'reviewing',
    });
    const service = new AdminService(prisma as never);

    await expect(
      service.updateApplicationStatus('application-1', 'reviewing'),
    ).resolves.toEqual({ id: 'application-1', status: 'reviewing' });
    expect(prisma.panditApplication.update).toHaveBeenCalledWith({
      where: { id: 'application-1' },
      data: { status: 'reviewing' },
    });
  });

  it('rejects an unknown application ID', async () => {
    const prisma = createPrisma();
    prisma.panditApplication.findUnique.mockResolvedValue(null);
    const service = new AdminService(prisma as never);

    await expect(
      service.updateApplicationStatus('application-1', 'approved'),
    ).rejects.toThrow(NotFoundException);
  });
});
