import { NotFoundException } from '@nestjs/common';
import { ExpertsService } from './experts.service';

describe('ExpertsService follow', () => {
  const userId = 'user-1';
  const panditId = 'pandit-1';

  function serviceWith(prisma: Record<string, unknown>) {
    return new ExpertsService(prisma as never);
  }

  it('follows an existing pandit', async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const service = serviceWith({
      pandit: { findUnique: jest.fn().mockResolvedValue({ id: panditId }) },
      panditFollow: { upsert },
    });

    await expect(service.followPandit(userId, panditId)).resolves.toEqual({
      following: true,
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { userId_panditId: { userId, panditId } },
      create: { userId, panditId },
      update: {},
    });
  });

  it('rejects a missing pandit', async () => {
    const service = serviceWith({
      pandit: { findUnique: jest.fn().mockResolvedValue(null) },
      panditFollow: { upsert: jest.fn() },
    });

    await expect(service.followPandit(userId, panditId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reports whether the row exists', async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce({ userId })
      .mockResolvedValueOnce(null);
    const service = serviceWith({
      panditFollow: { findUnique },
    });

    await expect(service.isFollowing(userId, panditId)).resolves.toEqual({
      following: true,
    });
    await expect(service.isFollowing(userId, panditId)).resolves.toEqual({
      following: false,
    });
  });

  it('unfollow deletes the pair', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = serviceWith({
      panditFollow: { deleteMany },
    });

    await expect(service.unfollowPandit(userId, panditId)).resolves.toEqual({
      following: false,
    });
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId, panditId } });
  });
});
