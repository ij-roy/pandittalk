import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type User } from '@prisma/client';
import { HealthResponseDto } from '@pandittalk/common';
import { PrismaService } from './prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { computeProfileProgress, type ProfileProgress } from './auth/profile-progress';
import {
  AVATAR_STORAGE,
  userAvatarObjectKey,
  type AvatarStorage,
} from './avatar/avatar-storage.interface';
import { localAvatarKeyFromUrl } from './avatar/avatar-url.util';
import {
  isAtLeastAge,
  MINIMUM_ACCOUNT_AGE,
  underageAccountMessage,
} from './lib/age';

const ALLOWED_AVATAR_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
]);
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export type UserProfilePayload = {
  id: string;
  phoneNumber: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  email: string | null;
  maritalStatus: string | null;
  dob: string | null;
  timeOfBirth: string | null;
  placeOfBirth: string | null;
  zodiacSign: string | null;
  currentAddress: string | null;
  city: string | null;
  postalCode: string | null;
  profileImageUrl: string | null;
  profileCompleted: boolean;
  googleLinked: boolean;
  profileProgress: ProfileProgress;
  walletBalance: string;
  coinBalance: number;
  createdAt: string;
};

@Injectable()
export class UserServiceService {
  private readonly avatarStorageMode: string;
  private readonly localAvatarPublicBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(AVATAR_STORAGE) private readonly avatarStorage: AvatarStorage,
  ) {
    this.avatarStorageMode = this.configService.get<string>(
      'AVATAR_STORAGE',
      'local',
    );
    this.localAvatarPublicBaseUrl = this.configService
      .get<string>('AVATAR_PUBLIC_BASE_URL', 'http://localhost:3001/static/avatars')
      .replace(/\/$/, '');
  }

  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      service: 'user-service',
      timestamp: new Date().toISOString(),
    };
  }

  async getProfile(userId: string): Promise<UserProfilePayload> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toProfilePayload(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfilePayload> {
    if (dto.dob !== undefined) {
      if (!isAtLeastAge(dto.dob, MINIMUM_ACCOUNT_AGE)) {
        throw new BadRequestException(underageAccountMessage());
      }
    }

    const data: Prisma.UserUpdateInput = {
      ...dto,
      profileCompleted: true,
      ...(dto.dob !== undefined ? { acceptedAge18: true } : {}),
    };

    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const composed = [dto.firstName, dto.lastName]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(' ')
        .trim();
      if (composed.length > 0) {
        data.name = composed;
      }
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId, isActive: true },
        data,
      });
      return this.toProfilePayload(user);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw err;
    }
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ profileImageUrl: string }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded');
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new BadRequestException('Image must be 5 MB or smaller');
    }
    const mime = (file.mimetype ?? '').toLowerCase();
    if (!ALLOWED_AVATAR_MIMES.has(mime)) {
      throw new BadRequestException('Only JPEG and PNG images are allowed');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const key = userAvatarObjectKey(userId);
    const baseUrl = await this.avatarStorage.put(key, file.buffer, mime);
    const profileImageUrl = `${baseUrl}?v=${Date.now()}`;

    if (this.avatarStorageMode === 'local' && user.profileImageUrl) {
      const previousKey = localAvatarKeyFromUrl(
        user.profileImageUrl,
        this.localAvatarPublicBaseUrl,
      );
      if (previousKey) {
        await this.avatarStorage.delete(previousKey);
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl },
    });

    return { profileImageUrl };
  }

  async softDeleteProfile(userId: string): Promise<{ success: true }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (this.avatarStorageMode === 's3') {
      await this.avatarStorage.delete(userAvatarObjectKey(userId));
    } else if (user.profileImageUrl) {
      const localKey = localAvatarKeyFromUrl(
        user.profileImageUrl,
        this.localAvatarPublicBaseUrl,
      );
      if (localKey) {
        await this.avatarStorage.delete(localKey);
      }
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.supportRequest.create({
          data: {
            userId,
            category: 'account_deletion',
            message:
              'User requested account deletion from the mobile app. Profile scrubbed; complete related-data anonymization per ops checklist.',
            email: user.email,
            status: 'received',
          },
        });

        await tx.authSession.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });

        await tx.savedReport.deleteMany({ where: { userId } });

        await tx.user.update({
          where: { id: userId, isActive: true },
          data: {
            isActive: false,
            phoneNumber: `deleted_${userId}`,
            name: null,
            firstName: null,
            lastName: null,
            gender: null,
            email: null,
            maritalStatus: null,
            dob: null,
            timeOfBirth: null,
            placeOfBirth: null,
            zodiacSign: null,
            currentAddress: null,
            city: null,
            postalCode: null,
            profileImageUrl: null,
            profileCompleted: false,
            googleSub: null,
            appleSub: null,
          },
        });
      });
      return { success: true };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw err;
    }
  }

  private toProfilePayload(user: User): UserProfilePayload {
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      email: user.email,
      maritalStatus: user.maritalStatus,
      dob: user.dob,
      timeOfBirth: user.timeOfBirth,
      placeOfBirth: user.placeOfBirth,
      zodiacSign: user.zodiacSign,
      currentAddress: user.currentAddress,
      city: user.city,
      postalCode: user.postalCode,
      profileImageUrl: user.profileImageUrl,
      profileCompleted: user.profileCompleted,
      googleLinked: Boolean(user.googleSub),
      profileProgress: computeProfileProgress(user),
      walletBalance: user.walletBalance.toString(),
      coinBalance: Math.floor(Number(user.walletBalance)),
      createdAt: user.createdAt.toISOString(),
    };
  }
}
