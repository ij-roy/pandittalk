import { ConfigService } from '@nestjs/config';
import { UserServiceService } from './user-service.service';
import { userAvatarObjectKey } from './avatar/avatar-storage.interface';

describe('UserServiceService account deletion', () => {
  it('deletes a Cloudinary avatar by its deterministic object key', async () => {
    const storage = {
      delete: jest.fn().mockResolvedValue(undefined),
      put: jest.fn(),
    };
    const tx = {
      supportRequest: { create: jest.fn() },
      authSession: { updateMany: jest.fn() },
      savedReport: { deleteMany: jest.fn() },
      user: { update: jest.fn() },
    };
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-1',
          isActive: true,
          profileImageUrl:
            'https://res.cloudinary.com/demo/image/upload/pandittalk/avatars/users/user-1.jpg',
        }),
      },
      $transaction: jest.fn(async (callback: (value: typeof tx) => unknown) =>
        callback(tx),
      ),
    };

    const service = new UserServiceService(
      prisma as never,
      new ConfigService({ AVATAR_STORAGE: 'cloudinary' }),
      storage,
    );

    await service.softDeleteProfile('user-1');

    expect(storage.delete).toHaveBeenCalledWith(userAvatarObjectKey('user-1'));
  });
});
