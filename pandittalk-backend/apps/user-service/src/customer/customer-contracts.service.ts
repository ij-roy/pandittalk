import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { OtpSmsService } from '../auth/sms/otp-sms.service';
import { hashOtp } from '../auth/otp-crypto.util';
import { randomInt } from 'node:crypto';
import { normalizeIndiaPhone } from '../auth/phone.util';
import {
  NotificationPreferencesDto,
  PanditApplicationDto,
  SupportRequestDto,
} from './dto';
import {
  MAX_FAMILY_MEMBERS,
  parseFamilyMemberInput,
  type FamilyMemberInput,
} from './family-member';

@Injectable()
export class CustomerContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly sessions: AuthSessionService,
    private readonly sms: OtpSmsService,
  ) {}
  async listContexts(userId: string) {
    return this.prisma.savedContext.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        text: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async createContext(userId: string, text: string) {
    return this.prisma.savedContext.create({
      data: { userId, text: text.trim() },
      select: {
        id: true,
        text: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async updateContext(userId: string, id: string, text: string) {
    const current = await this.prisma.savedContext.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Context not found');
    return this.prisma.savedContext.update({
      where: { id },
      data: { text: text.trim(), version: { increment: 1 } },
      select: {
        id: true,
        text: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async deleteContext(userId: string, id: string) {
    const result = await this.prisma.savedContext.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Context not found');
    return { success: true };
  }
  async shareContext(
    userId: string,
    id: string,
    dto: { bookingId: string; panditId: string },
  ) {
    const context = await this.prisma.savedContext.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!context) throw new NotFoundException('Context not found');
    const booking = await this.prisma.booking.findFirst({
      where: { id: dto.bookingId, userId, panditId: dto.panditId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.savedContextShare.upsert({
      where: {
        contextId_bookingId: { contextId: id, bookingId: dto.bookingId },
      },
      create: {
        contextId: id,
        bookingId: dto.bookingId,
        panditId: dto.panditId,
        contextVersion: context.version,
      },
      update: {
        panditId: dto.panditId,
        contextVersion: context.version,
        revokedAt: null,
      },
      select: {
        id: true,
        contextId: true,
        bookingId: true,
        panditId: true,
        contextVersion: true,
        createdAt: true,
      },
    });
  }
  async revokeContext(
    userId: string,
    id: string,
    bookingId: string,
    dto: { bookingId: string },
  ) {
    if (dto.bookingId !== bookingId)
      throw new BadRequestException('Booking mismatch');
    const context = await this.prisma.savedContext.findFirst({
      where: { id, userId },
    });
    if (!context) throw new NotFoundException('Context not found');
    const share = await this.prisma.savedContextShare.findFirst({
      where: { contextId: id, bookingId },
    });
    if (!share) throw new NotFoundException('Share not found');
    await this.prisma.savedContextShare.update({
      where: { id: share.id },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }
  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: {
        bookingReminders: true,
        sessionUpdates: true,
        messages: true,
        marketing: true,
        updatedAt: true,
      },
    });
  }
  async setPreferences(userId: string, dto: NotificationPreferencesDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
      select: {
        bookingReminders: true,
        sessionUpdates: true,
        messages: true,
        marketing: true,
        updatedAt: true,
      },
    });
  }
  async requestPhoneChange(userId: string, raw: string) {
    const phone = normalizeIndiaPhone(raw);
    if (!phone)
      throw new BadRequestException('Enter a valid Indian mobile number');
    const existing = await this.prisma.user.findFirst({
      where: { phoneNumber: phone, isActive: true },
    });
    if (existing && existing.id !== userId)
      throw new ConflictException('That phone number is already in use');
    const code = String(randomInt(1000, 10000));
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not configured');
    const challenge = await this.prisma.phoneChangeChallenge.create({
      data: {
        userId,
        phoneNumber: phone,
        otpHash: hashOtp(code, secret),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    await this.sms.sendOtp(phone, code);
    return {
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt.toISOString(),
    };
  }
  async verifyPhoneChange(userId: string, challengeId: string, otp: string) {
    const challenge = await this.prisma.phoneChangeChallenge.findFirst({
      where: { id: challengeId, userId, verifiedAt: null },
    });
    if (!challenge || challenge.expiresAt <= new Date())
      throw new UnauthorizedException('The phone-change code has expired');
    if (challenge.attempts >= 5)
      throw new HttpException(
        'Too many verification attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not configured');
    if (hashOtp(otp, secret) !== challenge.otpHash) {
      await this.prisma.phoneChangeChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Incorrect phone-change code');
    }
    const conflict = await this.prisma.user.findFirst({
      where: {
        phoneNumber: challenge.phoneNumber,
        isActive: true,
        id: { not: userId },
      },
    });
    if (conflict)
      throw new ConflictException('That phone number is already in use');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { phoneNumber: challenge.phoneNumber },
      }),
      this.prisma.phoneChangeChallenge.update({
        where: { id: challenge.id },
        data: { verifiedAt: new Date() },
      }),
    ]);
    await this.sessions.revokeAllSessions(userId);
    return { success: true };
  }
  async createSupportRequest(userId: string, dto: SupportRequestDto) {
    const request = await this.prisma.supportRequest.create({
      data: {
        userId,
        category: dto.category.trim(),
        message: dto.message.trim(),
        email: dto.email?.trim() || null,
      },
    });
    return {
      id: request.id,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    };
  }
  async listPanditBlocks(userId: string) {
    const rows = await this.prisma.userPanditBlock.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { panditId: true, createdAt: true },
    });
    return {
      panditIds: rows.map((r) => r.panditId),
      items: rows.map((r) => ({
        panditId: r.panditId,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
  async blockPandit(userId: string, panditId: string) {
    const pandit = await this.prisma.pandit.findUnique({
      where: { id: panditId },
      select: { id: true, name: true },
    });
    if (!pandit) throw new NotFoundException('Pandit not found');
    const block = await this.prisma.userPanditBlock.upsert({
      where: { userId_panditId: { userId, panditId } },
      create: { userId, panditId },
      update: {},
      select: { id: true, panditId: true, createdAt: true },
    });
    await this.prisma.supportRequest.create({
      data: {
        userId,
        category: 'block_user',
        message: `User blocked pandit id=${pandit.id} name=${pandit.name}.`,
      },
    });
    return {
      id: block.id,
      panditId: block.panditId,
      createdAt: block.createdAt.toISOString(),
    };
  }
  async unblockPandit(userId: string, panditId: string) {
    const result = await this.prisma.userPanditBlock.deleteMany({
      where: { userId, panditId },
    });
    if (!result.count) throw new NotFoundException('Block not found');
    return { success: true };
  }
  async createPanditApplication(dto: PanditApplicationDto) {
    if (!dto.consent) throw new BadRequestException('Consent is required');
    const item = await this.prisma.panditApplication.create({
      data: {
        name: dto.name.trim(),
        phone: normalizeIndiaPhone(dto.phone) || dto.phone,
        email: dto.email?.trim() || null,
        practice: dto.practice.trim(),
        languages: dto.languages.map((x) => x.trim()).filter(Boolean),
        message: dto.message?.trim() || null,
        consent: true,
      },
    });
    return {
      id: item.id,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    };
  }

  async listFamilyMembers(userId: string) {
    return this.prisma.familyMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        relation: true,
        name: true,
        dob: true,
        timeOfBirth: true,
        placeOfBirth: true,
        coordinates: true,
        createdAt: true,
      },
    });
  }

  async createFamilyMember(userId: string, raw: FamilyMemberInput) {
    const input = parseFamilyMemberInput(raw);
    const count = await this.prisma.familyMember.count({ where: { userId } });
    if (count >= MAX_FAMILY_MEMBERS) {
      throw new BadRequestException('You can save up to 8 family profiles');
    }
    return this.prisma.familyMember.create({
      data: { userId, ...input },
      select: {
        id: true,
        relation: true,
        name: true,
        dob: true,
        timeOfBirth: true,
        placeOfBirth: true,
        coordinates: true,
        createdAt: true,
      },
    });
  }

  async deleteFamilyMember(userId: string, id: string) {
    const result = await this.prisma.familyMember.deleteMany({
      where: { id, userId },
    });
    if (!result.count) throw new NotFoundException('Family profile not found');
    return { success: true };
  }
}
