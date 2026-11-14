import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma/prisma.service';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { ConfigService } from '@nestjs/config';
import { AVATAR_STORAGE } from './avatar/avatar-storage.interface';

describe('UserServiceController', () => {
  let userServiceController: UserServiceController;

  beforeEach(async () => {
    const prismaMock = {
      user: { update: jest.fn() },
    } as unknown as PrismaService;

    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserServiceController],
      providers: [
        UserServiceService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: { get: jest.fn((_key: string, fallback?: unknown) => fallback) } },
        { provide: AVATAR_STORAGE, useValue: {} },
      ],
    }).compile();

    userServiceController = app.get<UserServiceController>(
      UserServiceController,
    );
  });

  describe('root', () => {
    it('should return health payload', () => {
      const body = userServiceController.getHealth();
      expect(body.status).toBe('ok');
      expect(body.service).toBe('user-service');
      expect(typeof body.timestamp).toBe('string');
    });

    it('should return public app-update policy defaults', () => {
      const body = userServiceController.getAppUpdatePolicy();
      expect(body.ios.minSupportedVersion).toBe('1.0.0');
      expect(body.ios.latestVersion).toBe('1.0.9');
      expect(body.android.storeUrl).toContain('play.google.com');
    });
  });
});
