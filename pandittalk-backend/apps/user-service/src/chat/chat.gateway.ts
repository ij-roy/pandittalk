import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Booking, Pandit } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { BookingsService } from '../bookings/bookings.service';
import { PanditAvailabilityService } from '../bookings/pandit-availability.service';
import { PanditQueueService } from '../bookings/pandit-queue.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { NotificationPayload } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { parseAllowedOrigins } from '../config/cors-origins';
import { RedisClientService } from '../redis/redis-client.service';
import { CHAT_STORAGE } from './chat-storage.interface';
import type { ChatStorage } from './chat-storage.interface';
import type {
  AudioParticipantLeftPayload,
  AudioParticipantRejoinedPayload,
  AudioSessionEndedPayload,
  AudioSessionStartedPayload,
  AudioWaitingForOtherPayload,
  AudioWaitingForStartPayload,
  BookingSessionPayload,
  JoinAudioSessionPayload,
  JoinSessionPayload,
  JoinPanditDashboardPayload,
  JoinVideoSessionPayload,
  MediaPeerReadyPayload,
  MediaSignalPayload,
  NewBookingCreatedPayload,
  PanditBusyPayload,
  QueueExpiredPayload,
  QueuePositionUpdatedPayload,
  QueueReadyPayload,
  SendMessagePayload,
  SenderRole,
  SessionEndedWithRefundPayload,
  SessionRefundReason,
  SessionRefundedPayload,
  TypingPayload,
  VideoParticipantLeftPayload,
  VideoParticipantRejoinedPayload,
  VideoSessionEndedPayload,
  VideoSessionStartedPayload,
  VideoWaitingForOtherPayload,
  VideoWaitingForStartPayload,
  SessionGraceEndedPayload,
  VideoCameraStatePayload,
} from './types/chat.types';

const TIMER_INTERVAL_MS = 1_000;
const FIVE_MINUTES_SECONDS = 300;
const DEFAULT_WAITING_TIMEOUT_MS = 600_000;
const PANDIT_RECONNECT_MS = 60 * 1000;
const SESSION_GRACE_PERIOD_MS = 90_000;
const AV_DISCONNECT_GRACE_MS = 3_000;

interface ChatSocketData {
  userId?: string;
  bookingId?: string;
  role?: SenderRole;
  audioBookingId?: string;
  videoBookingId?: string;
}

type ChatSocket = Socket & { data: ChatSocketData };

type BookingWithPandit = Booking & {
  pandit: Pick<Pandit, 'userId'>;
};

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  private readonly sessionIntervals = new Map<string, NodeJS.Timeout>();
  private readonly audioSessionIntervals = new Map<string, NodeJS.Timeout>();
  private readonly audioWaitTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly videoSessionIntervals = new Map<string, NodeJS.Timeout>();
  private readonly videoWaitTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly waitingTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly panditReconnectTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly avDisconnectGraceTimeouts = new Map<
    string,
    NodeJS.Timeout
  >();
  private readonly waitingTimeoutMs: number;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(CHAT_STORAGE) private readonly chatStorage: ChatStorage,
    private readonly bookingsService: BookingsService,
    private readonly panditAvailability: PanditAvailabilityService,
    private readonly panditQueue: PanditQueueService,
    private readonly configService: ConfigService,
    private readonly redisClient: RedisClientService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    const raw = this.configService.get<string>(
      'CHAT_WAITING_TIMEOUT_MS',
      String(DEFAULT_WAITING_TIMEOUT_MS),
    );
    const parsed = Number(raw);
    this.waitingTimeoutMs =
      Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_WAITING_TIMEOUT_MS;
  }

  emitQueuePositionUpdated(
    userId: string,
    payload: QueuePositionUpdatedPayload,
  ): void {
    this.emitToUser(userId, 'queuePositionUpdated', payload);
  }

  emitQueueReady(userId: string, payload: QueueReadyPayload): void {
    this.emitToUser(userId, 'queueReady', payload);
  }

  emitQueueExpired(userId: string, payload: QueueExpiredPayload): void {
    this.emitToUser(userId, 'queueExpired', payload);
  }

  emitNewNotification(userId: string, payload: NotificationPayload): void {
    this.server.to(this.userRoom(userId)).emit('newNotification', payload);
  }

  async handleConnection(client: ChatSocket): Promise<void> {
    try {
      const handshakeToken = client.handshake.auth?.token;
      if (typeof handshakeToken === 'string' && handshakeToken.length > 0) {
        const userId = await this.authenticateClient(client);
        await client.join(this.userRoom(userId));
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Connection auth failed';
      this.logger.debug(
        `Socket ${client.id} connection auth skipped: ${message}`,
      );
    }
  }

  emitNewBookingCreated(payload: NewBookingCreatedPayload): void {
    this.server
      .to(this.panditRoom(payload.panditId))
      .emit('newBookingCreated', payload);
  }

  handleDisconnect(client: ChatSocket): void {
    void this.handleClientDisconnect(client);
  }

  @SubscribeMessage('joinSession')
  async handleJoinSession(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: JoinSessionPayload,
  ): Promise<void> {
    try {
      const userId = await this.authenticateClient(client, data.token);
      const booking = await this.loadBookingForParticipant(
        data.bookingId,
        userId,
      );
      const room = this.sessionRoom(data.bookingId);
      const isPandit = await this.isBookingPandit(userId, booking);

      await client.join(room);
      client.data.bookingId = data.bookingId;
      client.data.role = isPandit ? 'pandit' : 'user';

      const queueRoom = this.panditQueue.queueRoom(booking.panditId);
      await client.join(queueRoom);

      const history = await this.chatStorage.getMessageWindow(data.bookingId);
      const messages = history.messages;
      const hasMore = history.hasMore;
      const sessionStartedAt = await this.cacheManager.get<number>(
        this.sessionStartKey(data.bookingId),
      );
      const sessionEndTime = await this.cacheManager.get<number>(
        this.sessionEndKey(data.bookingId),
      );

      if (
        sessionStartedAt !== undefined &&
        sessionStartedAt !== null &&
        sessionEndTime !== undefined &&
        sessionEndTime !== null
      ) {
        client.emit('sessionJoined', {
          bookingId: data.bookingId,
          messages,
          hasMore,
        });
        client.emit('sessionStarted', {
          startedAt: sessionStartedAt,
          endTime: sessionEndTime,
          durationMinutes: booking.durationMinutes,
        });
        this.startSessionTimer(data.bookingId);
        this.emitTimeRemainingToClient(client, sessionEndTime);

        if (isPandit) {
          this.clearPanditReconnectTimeout(data.bookingId);
        }
        return;
      }

      if (isPandit) {
        await this.startPanditSession(
          client,
          data.bookingId,
          booking,
          room,
          messages,
          hasMore,
        );
        return;
      }

      await this.enterUserWaitingRoom(
        client,
        userId,
        data.bookingId,
        booking,
        messages,
        hasMore,
        sessionEndTime,
      );
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('loadEarlierMessages')
  async handleLoadEarlierMessages(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody()
    data: { bookingId: string; beforeTimestamp: number; token?: string },
  ): Promise<void> {
    try {
      const userId = await this.authenticateClient(client, data.token);
      await this.loadBookingForParticipant(data.bookingId, userId);
      const before = Number(data.beforeTimestamp);
      if (!Number.isFinite(before)) {
        client.emit('earlierMessages', {
          bookingId: data.bookingId,
          messages: [],
          hasMore: false,
        });
        return;
      }
      const history = await this.chatStorage.getMessageWindow(
        data.bookingId,
        {
          beforeTimestamp: before,
        },
      );
      client.emit('earlierMessages', {
        bookingId: data.bookingId,
        messages: history.messages,
        hasMore: history.hasMore,
      });
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('leaveSession')
  async handleLeaveSession(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: BookingSessionPayload,
  ): Promise<void> {
    try {
      const userId = await this.requireAuthenticatedUser(client);
      await this.loadBookingForParticipant(data.bookingId, userId);
      await client.leave(this.sessionRoom(data.bookingId));
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('joinPanditDashboard')
  async handleJoinPanditDashboard(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: JoinPanditDashboardPayload,
  ): Promise<void> {
    try {
      const userId = await this.authenticateClient(client, data.token);
      const pandit = await this.prisma.pandit.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!pandit) {
        throw new Error('You are not authorized to join this pandit dashboard');
      }

      if (data.panditId && data.panditId !== pandit.id) {
        this.logger.debug(
          `Client sent panditId ${data.panditId} but user maps to ${pandit.id}`,
        );
      }

      await client.join(this.panditRoom(pandit.id));
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: SendMessagePayload,
  ): Promise<void> {
    try {
      const userId = await this.requireAuthenticatedUser(client);
      const booking = await this.loadBookingForParticipant(
        data.bookingId,
        userId,
      );
      const room = this.sessionRoom(data.bookingId);

      if (!client.rooms.has(room)) {
        throw new Error('You must join the session before sending messages');
      }

      const senderRole = this.resolveSenderRole(userId, booking);
      const timestamp = Date.now();

      await this.chatStorage.saveMessage(
        data.bookingId,
        userId,
        senderRole,
        data.message,
        timestamp,
      );

      this.server.to(room).emit('newMessage', {
        senderId: userId,
        senderRole,
        message: data.message,
        timestamp,
      });

      await this.notifyNewMessage(booking, userId, senderRole, data.message);
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: TypingPayload,
  ): Promise<void> {
    try {
      const userId = await this.requireAuthenticatedUser(client);
      await this.loadBookingForParticipant(data.bookingId, userId);
      const room = this.sessionRoom(data.bookingId);
      client.to(room).emit('typingIndicator', {
        bookingId: data.bookingId,
        userId,
      });
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('endSession')
  async handleEndSession(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: BookingSessionPayload,
  ): Promise<void> {
    try {
      const userId = await this.requireAuthenticatedUser(client);
      const booking = await this.loadBookingForParticipant(
        data.bookingId,
        userId,
      );

      if (booking.pandit.userId === userId) {
        throw new Error('Pandits can leave but not end the session');
      }

      if (booking.userId !== userId) {
        throw new Error('Only the booking user can end the session');
      }

      const sessionStarted = await this.hasSessionStarted(data.bookingId);

      if (!sessionStarted) {
        this.clearPanditReconnectTimeout(data.bookingId);
        const result = await this.bookingsService.cancelWithRefund(
          data.bookingId,
          'Session refund — ended before pandit joined',
        );
        if (result.applied) {
          const payload: SessionRefundedPayload = {
            reason: 'ended_before_start',
            coinsRefunded: result.coinsRefunded,
            message: `Since your pandit had not yet joined, a full refund of ${result.coinsRefunded} coins has been issued to your wallet.`,
          };
          await this.notifyChatNowMissed(booking);
          client.emit('sessionRefunded', payload);
          this.server
            .to(this.sessionRoom(data.bookingId))
            .emit('sessionRefunded', payload);
        }
        const gracePayload: SessionGraceEndedPayload = {
          bookingId: data.bookingId,
          message:
            'The user ended this session before it started. This booking has been cancelled.',
        };
        client.emit('sessionGraceEnded', gracePayload);
        this.server
          .to(this.sessionRoom(data.bookingId))
          .emit('sessionGraceEnded', gracePayload);
        await this.cleanupSession(data.bookingId, booking.panditId);
      } else if (await this.isWithinGracePeriod(data.bookingId, 'chat')) {
        this.clearPanditReconnectTimeout(data.bookingId);
        await this.handleGraceRefund(data.bookingId, booking, client);
      } else {
        await this.completeSession(data.bookingId, booking.panditId);
      }

      await client.leave(this.sessionRoom(data.bookingId));
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('joinAudioSession')
  async handleJoinAudioSession(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: JoinAudioSessionPayload,
  ): Promise<void> {
    try {
      const userId = await this.authenticateClient(client, data.token);
      const booking = await this.loadBookingForParticipant(
        data.bookingId,
        userId,
      );

      if (booking.format !== 'audio') {
        throw new Error('Booking format must be audio');
      }

      if (booking.status !== 'confirmed') {
        throw new Error('Booking status must be confirmed');
      }

      const room = this.audioRoom(data.bookingId);
      await client.join(room);
      client.data.audioBookingId = data.bookingId;

      const ttlSeconds = (booking.durationMinutes + 10) * 60;
      await this.addAudioRoomParticipant(data.bookingId, userId, ttlSeconds);

      const sessionStarted = await this.hasAudioSessionStarted(data.bookingId);

      if (sessionStarted) {
        this.clearAvDisconnectGraceTimeout('audio', data.bookingId, userId);

        const participantCount = await this.getAudioRoomParticipantCount(
          data.bookingId,
        );
        if (participantCount >= 2) {
          this.emitMediaPeerReady(client, room, data.bookingId, 'audio');
        }

        const startedAt = await this.cacheManager.get<number>(
          this.audioStartKey(data.bookingId),
        );
        const endTime = await this.cacheManager.get<number>(
          this.audioEndKey(data.bookingId),
        );

        if (
          startedAt !== undefined &&
          startedAt !== null &&
          endTime !== undefined &&
          endTime !== null
        ) {
          const payload: AudioSessionStartedPayload = {
            startedAt,
            endTime,
            durationMinutes: booking.durationMinutes,
          };
          client.emit('audioSessionStarted', payload);
          this.emitTimeRemainingToClient(client, endTime);
          this.notifyAvParticipantRejoined(client, data.bookingId, 'audio');
        }
        return;
      }

      const participantCount = await this.getAudioRoomParticipantCount(
        data.bookingId,
      );

      if (participantCount < 2) {
        const isPandit = await this.isBookingPandit(userId, booking);
        const payload: AudioWaitingForOtherPayload = {
          bookingId: data.bookingId,
          waitingForRole: isPandit ? 'user' : 'pandit',
        };
        client.emit('audioWaitingForOther', payload);
        return;
      }

      this.emitMediaPeerReady(client, room, data.bookingId, 'audio');

      const now = new Date();
      const startTime = booking.startTime;

      if (now < startTime) {
        const waitingPayload: AudioWaitingForStartPayload = {
          startsAt: startTime.toISOString(),
        };

        if (!this.audioWaitTimeouts.has(data.bookingId)) {
          const msUntilStart = startTime.getTime() - now.getTime();
          const waitTimeout = setTimeout(() => {
            void (async () => {
              this.audioWaitTimeouts.delete(data.bookingId);
              if (await this.hasAudioSessionStarted(data.bookingId)) {
                return;
              }

              const startedAtMs = startTime.getTime();
              const endTime = startedAtMs + booking.durationMinutes * 60 * 1000;
              const payload: AudioSessionStartedPayload = {
                startedAt: startedAtMs,
                endTime,
                durationMinutes: booking.durationMinutes,
              };
              this.server.to(room).emit('audioSessionStarted', payload);
              await this.startAudioTimer(
                data.bookingId,
                booking.durationMinutes,
                startedAtMs,
              );
              await this.notifySessionStarted(data.bookingId);
            })();
          }, msUntilStart);

          this.audioWaitTimeouts.set(data.bookingId, waitTimeout);
        }

        this.server.to(room).emit('audioWaitingForStart', waitingPayload);
        return;
      } else {
        const startedAtMs = now.getTime();
        const endTime = startedAtMs + booking.durationMinutes * 60 * 1000;
        const payload: AudioSessionStartedPayload = {
          startedAt: startedAtMs,
          endTime,
          durationMinutes: booking.durationMinutes,
        };
        this.server.to(room).emit('audioSessionStarted', payload);
        await this.startAudioTimer(
          data.bookingId,
          booking.durationMinutes,
          startedAtMs,
        );
        await this.notifySessionStarted(data.bookingId);
      }
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('leaveAudioSession')
  async handleLeaveAudioSession(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: BookingSessionPayload,
  ): Promise<void> {
    try {
      const userId = await this.requireAuthenticatedUser(client);
      await this.loadBookingForParticipant(data.bookingId, userId);
      this.clearAvDisconnectGraceTimeout('audio', data.bookingId, userId);
      await this.removeAudioRoomParticipant(data.bookingId, userId);
      await client.leave(this.audioRoom(data.bookingId));
      client.data.audioBookingId = undefined;

      const payload: AudioParticipantLeftPayload = {
        bookingId: data.bookingId,
      };
      client
        .to(this.audioRoom(data.bookingId))
        .emit('audioParticipantLeft', payload);

      const sessionStarted = await this.hasAudioSessionStarted(data.bookingId);
      const participantCount = await this.getAudioRoomParticipantCount(
        data.bookingId,
      );

      if (!sessionStarted && participantCount < 2) {
        const booking = await this.prisma.booking.findUnique({
          where: { id: data.bookingId },
          include: { pandit: { select: { userId: true } } },
        });
        const waitingForRole: SenderRole =
          booking && booking.pandit.userId === userId ? 'user' : 'pandit';
        const waitingPayload: AudioWaitingForOtherPayload = {
          bookingId: data.bookingId,
          waitingForRole,
        };
        this.server
          .to(this.audioRoom(data.bookingId))
          .emit('audioWaitingForOther', waitingPayload);
      }
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('endAudioSession')
  async handleEndAudioSession(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: BookingSessionPayload,
  ): Promise<void> {
    try {
      const userId = await this.requireAuthenticatedUser(client);
      const booking = await this.loadBookingForParticipant(
        data.bookingId,
        userId,
      );

      if (booking.pandit.userId === userId) {
        throw new Error('Pandits can leave but not end the session');
      }

      this.clearAudioWaitTimeout(data.bookingId);
      this.clearAudioSessionTimer(data.bookingId);

      const payload: AudioSessionEndedPayload = { bookingId: data.bookingId };
      this.server
        .to(this.audioRoom(data.bookingId))
        .emit('audioSessionEnded', payload);

      await this.clearAudioSessionRedisKeys(data.bookingId);
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('joinVideoSession')
  async handleJoinVideoSession(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: JoinVideoSessionPayload,
  ): Promise<void> {
    try {
      const userId = await this.authenticateClient(client, data.token);
      const booking = await this.loadBookingForParticipant(
        data.bookingId,
        userId,
      );

      if (booking.format !== 'video') {
        throw new Error('Booking format must be video');
      }

      if (booking.status !== 'confirmed') {
        throw new Error('Booking status must be confirmed');
      }

      const room = this.videoRoom(data.bookingId);
      await client.join(room);
      client.data.videoBookingId = data.bookingId;

      const ttlSeconds = (booking.durationMinutes + 10) * 60;
      await this.addVideoRoomParticipant(data.bookingId, userId, ttlSeconds);

      const sessionStarted = await this.hasVideoSessionStarted(data.bookingId);

      if (sessionStarted) {
        this.clearAvDisconnectGraceTimeout('video', data.bookingId, userId);

        const participantCount = await this.getVideoRoomParticipantCount(
          data.bookingId,
        );
        if (participantCount >= 2) {
          this.emitMediaPeerReady(client, room, data.bookingId, 'video');
        }

        const startedAt = await this.cacheManager.get<number>(
          this.videoStartKey(data.bookingId),
        );
        const endTime = await this.cacheManager.get<number>(
          this.videoEndKey(data.bookingId),
        );

        if (
          startedAt !== undefined &&
          startedAt !== null &&
          endTime !== undefined &&
          endTime !== null
        ) {
          const payload: VideoSessionStartedPayload = {
            startedAt,
            endTime,
            durationMinutes: booking.durationMinutes,
          };
          client.emit('videoSessionStarted', payload);
          this.emitTimeRemainingToClient(client, endTime);
          this.notifyAvParticipantRejoined(client, data.bookingId, 'video');
        }
        return;
      }

      const participantCount = await this.getVideoRoomParticipantCount(
        data.bookingId,
      );

      if (participantCount < 2) {
        const isPandit = await this.isBookingPandit(userId, booking);
        const payload: VideoWaitingForOtherPayload = {
          bookingId: data.bookingId,
          waitingForRole: isPandit ? 'user' : 'pandit',
        };
        client.emit('videoWaitingForOther', payload);
        return;
      }

      this.emitMediaPeerReady(client, room, data.bookingId, 'video');

      const now = new Date();
      const startTime = booking.startTime;

      if (now < startTime) {
        const waitingPayload: VideoWaitingForStartPayload = {
          startsAt: startTime.toISOString(),
        };

        if (!this.videoWaitTimeouts.has(data.bookingId)) {
          const msUntilStart = startTime.getTime() - now.getTime();
          const waitTimeout = setTimeout(() => {
            void (async () => {
              this.videoWaitTimeouts.delete(data.bookingId);
              if (await this.hasVideoSessionStarted(data.bookingId)) {
                return;
              }

              const startedAtMs = startTime.getTime();
              const endTime = startedAtMs + booking.durationMinutes * 60 * 1000;
              const payload: VideoSessionStartedPayload = {
                startedAt: startedAtMs,
                endTime,
                durationMinutes: booking.durationMinutes,
              };
              this.server.to(room).emit('videoSessionStarted', payload);
              await this.startVideoTimer(
                data.bookingId,
                booking.durationMinutes,
                startedAtMs,
              );
              await this.notifySessionStarted(data.bookingId);
            })();
          }, msUntilStart);

          this.videoWaitTimeouts.set(data.bookingId, waitTimeout);
        }

        this.server.to(room).emit('videoWaitingForStart', waitingPayload);
        return;
      } else {
        const startedAtMs = now.getTime();
        const endTime = startedAtMs + booking.durationMinutes * 60 * 1000;
        const payload: VideoSessionStartedPayload = {
          startedAt: startedAtMs,
          endTime,
          durationMinutes: booking.durationMinutes,
        };
        this.server.to(room).emit('videoSessionStarted', payload);
        await this.startVideoTimer(
          data.bookingId,
          booking.durationMinutes,
          startedAtMs,
        );
        await this.notifySessionStarted(data.bookingId);
      }
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('mediaSignal')
  async handleMediaSignal(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: MediaSignalPayload,
  ): Promise<void> {
    try {
      const userId = await this.requireAuthenticatedUser(client);
      const booking = await this.loadBookingForParticipant(
        data.bookingId,
        userId,
      );

      if (data.format !== 'audio' && data.format !== 'video') {
        throw new Error('Unsupported media format');
      }
      if (booking.format !== data.format) {
        throw new Error(`Booking format must be ${data.format}`);
      }
      if (!this.isWebRtcSignal(data.signal)) {
        throw new Error('Invalid WebRTC signal');
      }

      const room =
        data.format === 'audio'
          ? this.audioRoom(data.bookingId)
          : this.videoRoom(data.bookingId);
      client.to(room).emit('mediaSignal', {
        bookingId: data.bookingId,
        format: data.format,
        signal: data.signal,
      } satisfies MediaSignalPayload);
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('leaveVideoSession')
  async handleLeaveVideoSession(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: BookingSessionPayload,
  ): Promise<void> {
    try {
      const userId = await this.requireAuthenticatedUser(client);
      await this.loadBookingForParticipant(data.bookingId, userId);
      this.clearAvDisconnectGraceTimeout('video', data.bookingId, userId);
      await this.removeVideoRoomParticipant(data.bookingId, userId);
      await client.leave(this.videoRoom(data.bookingId));
      client.data.videoBookingId = undefined;

      const payload: VideoParticipantLeftPayload = {
        bookingId: data.bookingId,
      };
      client
        .to(this.videoRoom(data.bookingId))
        .emit('videoParticipantLeft', payload);

      const sessionStarted = await this.hasVideoSessionStarted(data.bookingId);
      const participantCount = await this.getVideoRoomParticipantCount(
        data.bookingId,
      );

      if (!sessionStarted && participantCount < 2) {
        const booking = await this.prisma.booking.findUnique({
          where: { id: data.bookingId },
          include: { pandit: { select: { userId: true } } },
        });
        const waitingForRole: SenderRole =
          booking && booking.pandit.userId === userId ? 'user' : 'pandit';
        const waitingPayload: VideoWaitingForOtherPayload = {
          bookingId: data.bookingId,
          waitingForRole,
        };
        this.server
          .to(this.videoRoom(data.bookingId))
          .emit('videoWaitingForOther', waitingPayload);
      }
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('endVideoSession')
  async handleEndVideoSession(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: BookingSessionPayload,
  ): Promise<void> {
    try {
      const userId = await this.requireAuthenticatedUser(client);
      const booking = await this.loadBookingForParticipant(
        data.bookingId,
        userId,
      );

      if (booking.pandit.userId === userId) {
        throw new Error('Pandits can leave but not end the session');
      }

      this.clearVideoWaitTimeout(data.bookingId);
      this.clearVideoSessionTimer(data.bookingId);

      const payload: VideoSessionEndedPayload = { bookingId: data.bookingId };
      this.server
        .to(this.videoRoom(data.bookingId))
        .emit('videoSessionEnded', payload);

      await this.clearVideoSessionRedisKeys(data.bookingId);
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('requestGraceRefund')
  async handleRequestGraceRefund(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: BookingSessionPayload,
  ): Promise<void> {
    try {
      const userId = await this.requireAuthenticatedUser(client);
      const booking = await this.loadBookingForParticipant(
        data.bookingId,
        userId,
      );

      if (booking.userId !== userId) {
        throw new Error(
          'Only the booking user can request a grace-period refund',
        );
      }

      const format = booking.format;
      if (format !== 'chat' && format !== 'audio' && format !== 'video') {
        throw new Error(
          'Grace refund is not supported for this booking format',
        );
      }

      this.clearPanditReconnectTimeout(data.bookingId);

      const sessionStarted =
        format === 'chat'
          ? await this.hasSessionStarted(data.bookingId)
          : format === 'audio'
            ? await this.hasAudioSessionStarted(data.bookingId)
            : await this.hasVideoSessionStarted(data.bookingId);

      if (!sessionStarted) {
        throw new Error(
          'Grace-period refund is only available after the session has started',
        );
      }

      if (!(await this.isWithinGracePeriod(data.bookingId, format))) {
        throw new Error(
          'Grace-period refund is only available within 90 seconds of session start',
        );
      }

      await this.handleGraceRefund(data.bookingId, booking, client);
      await client.leave(this.sessionRoom(data.bookingId));
      await client.leave(this.audioRoom(data.bookingId));
      await client.leave(this.videoRoom(data.bookingId));
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('videoCameraState')
  async handleVideoCameraState(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() data: VideoCameraStatePayload,
  ): Promise<void> {
    try {
      const userId = await this.requireAuthenticatedUser(client);
      const booking = await this.loadBookingForParticipant(
        data.bookingId,
        userId,
      );

      if (typeof data.cameraOn !== 'boolean') {
        return;
      }

      const payload: VideoCameraStatePayload = {
        bookingId: data.bookingId,
        cameraOn: data.cameraOn,
        senderRole: this.resolveSenderRole(userId, booking),
      };
      client
        .to(this.videoRoom(data.bookingId))
        .emit('videoCameraState', payload);
    } catch (error: unknown) {
      this.emitError(client, error);
    }
  }

  private async handleClientDisconnect(client: ChatSocket): Promise<void> {
    const userId = client.data.userId;
    if (client.data.audioBookingId && userId) {
      await this.handleAvSocketDisconnect(
        client.data.audioBookingId,
        userId,
        'audio',
      );
      client.data.audioBookingId = undefined;
    }

    if (client.data.videoBookingId && userId) {
      await this.handleAvSocketDisconnect(
        client.data.videoBookingId,
        userId,
        'video',
      );
      client.data.videoBookingId = undefined;
    }

    if (client.data.role !== 'pandit' || !client.data.bookingId) {
      return;
    }

    const bookingId = client.data.bookingId;
    const sessionStarted = await this.hasSessionStarted(bookingId);
    if (!sessionStarted) {
      return;
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        panditId: true,
        durationMinutes: true,
        coinsDeducted: true,
      },
    });

    if (!booking) {
      return;
    }

    this.schedulePanditReconnectTimeout(bookingId, booking);
  }

  private schedulePanditReconnectTimeout(
    bookingId: string,
    booking: {
      panditId: string;
      durationMinutes: number;
      coinsDeducted: number;
    },
  ): void {
    this.clearPanditReconnectTimeout(bookingId);
    void this.resolvePanditReconnectDelayMs(bookingId).then((delayMs) => {
      const reconnectSeconds = Math.max(1, Math.ceil(delayMs / 1000));
      this.server.to(this.sessionRoom(bookingId)).emit('panditDisconnected', {
        bookingId,
        reconnectSeconds,
      });
      const timeout = setTimeout(() => {
        void this.handlePanditReconnectTimeout(bookingId, booking);
      }, delayMs);
      this.panditReconnectTimeouts.set(bookingId, timeout);
    });
  }

  private async resolvePanditReconnectDelayMs(
    bookingId: string,
  ): Promise<number> {
    const startedAt = await this.getSessionStartedAtMs(bookingId, 'chat');
    if (startedAt === null) {
      return PANDIT_RECONNECT_MS;
    }

    const remainingGrace = SESSION_GRACE_PERIOD_MS - (Date.now() - startedAt);
    if (remainingGrace > 0) {
      return remainingGrace;
    }

    return PANDIT_RECONNECT_MS;
  }

  private async handlePanditReconnectTimeout(
    bookingId: string,
    booking: {
      panditId: string;
      durationMinutes: number;
      coinsDeducted: number;
    },
  ): Promise<void> {
    this.panditReconnectTimeouts.delete(bookingId);

    const sessionStarted = await this.hasSessionStarted(bookingId);
    if (!sessionStarted) {
      return;
    }

    if (await this.isWithinGracePeriod(bookingId, 'chat')) {
      const startedAt = await this.getSessionStartedAtMs(bookingId, 'chat');
      const remainingGrace =
        startedAt === null
          ? 0
          : SESSION_GRACE_PERIOD_MS - (Date.now() - startedAt);
      if (remainingGrace > 0) {
        const timeout = setTimeout(() => {
          void this.handlePanditReconnectTimeout(bookingId, booking);
        }, remainingGrace);
        this.panditReconnectTimeouts.set(bookingId, timeout);
        return;
      }
    }

    const endTime = await this.cacheManager.get<number>(
      this.sessionEndKey(bookingId),
    );
    const remainingSeconds =
      endTime !== undefined && endTime !== null
        ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
        : 0;

    const totalSeconds = booking.durationMinutes * 60;
    const refundCoins =
      totalSeconds > 0
        ? Math.floor((remainingSeconds / totalSeconds) * booking.coinsDeducted)
        : 0;

    const result = await this.bookingsService.partialRefundAndComplete(
      bookingId,
      refundCoins,
      'Partial refund — pandit disconnected',
    );

    if (result.applied) {
      const payload: SessionEndedWithRefundPayload = {
        coinsRefunded: result.coinsRefunded,
        message: `Your pandit got disconnected. We have issued a partial refund of ${result.coinsRefunded} coins for the unused session time.`,
      };
      this.server
        .to(this.sessionRoom(bookingId))
        .emit('sessionEndedWithRefund', payload);
    }

    await this.cleanupSession(bookingId, booking.panditId);
  }

  private async startPanditSession(
    client: ChatSocket,
    bookingId: string,
    booking: Booking,
    room: string,
    messages: Awaited<ReturnType<ChatStorage['getMessages']>>,
    hasMore = false,
  ): Promise<void> {
    this.clearWaitingTimeout(bookingId);
    this.clearPanditReconnectTimeout(bookingId);
    await this.cacheManager.del(this.sessionWaitingKey(bookingId));

    const startedAt = Date.now();
    const endTime = startedAt + booking.durationMinutes * 60 * 1000;
    const ttlMs = (booking.durationMinutes + 10) * 60 * 1000;

    await this.cacheManager.set(
      this.sessionStartKey(bookingId),
      startedAt,
      ttlMs,
    );
    await this.cacheManager.set(this.sessionEndKey(bookingId), endTime, ttlMs);
    await this.panditAvailability.markPanditActive(
      booking.panditId,
      bookingId,
      ttlMs,
    );

    client.emit('sessionJoined', { bookingId, messages, hasMore });
    this.server.to(room).emit('sessionStarted', {
      startedAt,
      endTime,
      durationMinutes: booking.durationMinutes,
    });

    this.startSessionTimer(bookingId);
    await this.notifySessionStarted(bookingId, booking);
  }

  private async enterUserWaitingRoom(
    client: ChatSocket,
    userId: string,
    bookingId: string,
    booking: Booking,
    messages: Awaited<ReturnType<ChatStorage['getMessages']>>,
    hasMore = false,
    _existingEndTime: number | null | undefined,
  ): Promise<void> {
    await this.cacheManager.set(
      this.sessionWaitingKey(bookingId),
      userId,
      this.waitingTimeoutMs,
    );
    this.startWaitingTimeout(bookingId, booking);

    client.emit('sessionJoined', { bookingId, messages, hasMore });
    client.emit('waitingForPandit', { bookingId });

    const busyWithOther =
      await this.panditAvailability.isPanditBusyWithOtherBooking(
        booking.panditId,
        bookingId,
      );

    if (busyWithOther) {
      const active = await this.panditAvailability.getActiveSession(
        booking.panditId,
      );
      const payload: PanditBusyPayload = {
        bookingId,
        reason: 'on_another_call',
        activeBookingEndsAt: active?.estimatedFreeAt.toISOString() ?? null,
        message:
          'Your pandit is finishing another session. You are in the waiting room for your booking.',
      };
      client.emit('panditBusy', payload);
    }
  }

  private startWaitingTimeout(bookingId: string, booking: Booking): void {
    if (this.waitingTimeouts.has(bookingId)) {
      return;
    }

    const timeout = setTimeout(() => {
      void this.handleWaitingTimeout(bookingId, booking);
    }, this.waitingTimeoutMs);

    this.waitingTimeouts.set(bookingId, timeout);
  }

  private async handleWaitingTimeout(
    bookingId: string,
    booking: Booking,
  ): Promise<void> {
    this.waitingTimeouts.delete(bookingId);

    const currentBooking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!currentBooking || currentBooking.status === 'cancelled') {
      return;
    }

    const sessionStarted = await this.hasSessionStarted(bookingId);
    if (sessionStarted) {
      return;
    }

    const result = await this.bookingsService.cancelWithRefund(
      bookingId,
      'Session refund — pandit timeout',
    );

    if (result.applied) {
      await this.bookingsService.setPanditOffline(booking.panditId);
      await this.notifyChatNowMissed(booking);

      const payload: SessionRefundedPayload = {
        reason: 'pandit_timeout',
        coinsRefunded: result.coinsRefunded,
        message: `Your pandit was unable to join within the allotted time. A full refund of ${result.coinsRefunded} coins has been issued to your wallet.`,
      };
      this.server
        .to(this.sessionRoom(bookingId))
        .emit('sessionRefunded', payload);
    }

    await this.cleanupSession(bookingId, booking.panditId);
  }

  private async completeSession(
    bookingId: string,
    panditId: string,
  ): Promise<void> {
    this.server
      .to(this.sessionRoom(bookingId))
      .emit('sessionEnded', { bookingId });
    await this.notifySessionEnded(bookingId);
    await this.bookingsService.markCompleted(bookingId);
    await this.cleanupSession(bookingId, panditId);
  }

  private async handleNeverStartedRefund(
    bookingId: string,
    reason: SessionRefundReason,
    transactionDescription: string,
    message: string,
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    const result = await this.bookingsService.cancelWithRefund(
      bookingId,
      transactionDescription,
    );

    if (result.applied) {
      if (booking) {
        await this.notifyChatNowMissed(booking);
      }
      const payload: SessionRefundedPayload = {
        reason,
        coinsRefunded: result.coinsRefunded,
        message,
      };
      this.server
        .to(this.sessionRoom(bookingId))
        .emit('sessionRefunded', payload);
    }

    await this.cleanupSession(bookingId, booking?.panditId ?? '');
  }

  private async cleanupSession(
    bookingId: string,
    panditId: string,
  ): Promise<void> {
    this.clearSessionTimer(bookingId);
    this.clearWaitingTimeout(bookingId);
    this.clearPanditReconnectTimeout(bookingId);
    await this.clearSessionRedisKeys(bookingId);

    if (panditId) {
      await this.panditAvailability.clearPanditActive(panditId);
      await this.panditQueue.processNextInQueue(panditId);
    }
  }

  private startSessionTimer(bookingId: string): void {
    if (this.sessionIntervals.has(bookingId)) {
      return;
    }

    const interval = setInterval(() => {
      void this.tickSessionTimer(bookingId);
    }, TIMER_INTERVAL_MS);

    this.sessionIntervals.set(bookingId, interval);
  }

  private async tickSessionTimer(bookingId: string): Promise<void> {
    await this.withDistributedLock(`lock:session-timer:${bookingId}`, () =>
      this.tickSessionTimerOwned(bookingId),
    );
  }

  private async tickSessionTimerOwned(bookingId: string): Promise<void> {
    const endTime = await this.cacheManager.get<number>(
      this.sessionEndKey(bookingId),
    );
    if (endTime === undefined || endTime === null) {
      return;
    }

    const secondsLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    const sessionStarted = await this.hasSessionStarted(bookingId);
    const room = this.sessionRoom(bookingId);

    if (sessionStarted) {
      this.server.to(room).emit('timeRemaining', { secondsLeft });

      if (
        secondsLeft <= FIVE_MINUTES_SECONDS &&
        (await this.claimOnce(
          this.sessionWarningKey(bookingId),
          15 * 60 * 1000,
        ))
      ) {
        this.server.to(room).emit('warningFiveMinutes', { bookingId });
      }
    }

    if (secondsLeft <= 0) {
      this.server.to(room).emit('sessionTimeUp', { bookingId });

      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { panditId: true, coinsDeducted: true },
      });

      if (!sessionStarted) {
        const coins = booking?.coinsDeducted ?? 0;
        await this.handleNeverStartedRefund(
          bookingId,
          'pandit_unavailable',
          'Session refund — pandit was unavailable',
          `We were unable to connect you with your pandit. A full refund of ${coins} coins has been issued to your wallet.`,
        );
        return;
      }

      if (booking) {
        await this.completeSession(bookingId, booking.panditId);
      }
    }
  }

  private emitTimeRemainingToClient(client: ChatSocket, endTime: number): void {
    const secondsLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    client.emit('timeRemaining', { secondsLeft });
  }

  private async withDistributedLock(
    key: string,
    task: () => Promise<void>,
  ): Promise<void> {
    const token = randomUUID();
    const acquired = await this.redisClient.setIfAbsent(key, token, 2_500);
    if (!acquired) {
      return;
    }

    try {
      await task();
    } finally {
      await this.redisClient.releaseLock(key, token);
    }
  }

  private async hasSessionStarted(bookingId: string): Promise<boolean> {
    const startedAt = await this.cacheManager.get<number>(
      this.sessionStartKey(bookingId),
    );
    return startedAt !== undefined && startedAt !== null;
  }

  private clearSessionTimer(bookingId: string): void {
    const interval = this.sessionIntervals.get(bookingId);
    if (interval) {
      clearInterval(interval);
      this.sessionIntervals.delete(bookingId);
    }
  }

  private clearWaitingTimeout(bookingId: string): void {
    const timeout = this.waitingTimeouts.get(bookingId);
    if (timeout) {
      clearTimeout(timeout);
      this.waitingTimeouts.delete(bookingId);
    }
  }

  private clearPanditReconnectTimeout(bookingId: string): void {
    const timeout = this.panditReconnectTimeouts.get(bookingId);
    if (timeout) {
      clearTimeout(timeout);
      this.panditReconnectTimeouts.delete(bookingId);
    }
  }

  private async clearSessionRedisKeys(bookingId: string): Promise<void> {
    await this.cacheManager.del(this.sessionStartKey(bookingId));
    await this.cacheManager.del(this.sessionEndKey(bookingId));
    await this.cacheManager.del(this.sessionWaitingKey(bookingId));
    await this.redisClient.del(this.sessionWarningKey(bookingId));
    await this.redisClient.del(
      this.sessionNotificationKey('started', bookingId),
    );
    await this.redisClient.del(this.sessionNotificationKey('ended', bookingId));
  }

  private sessionRoom(bookingId: string): string {
    return `session:${bookingId}`;
  }

  private async isUserInSessionRoom(
    userId: string,
    bookingId: string,
  ): Promise<boolean> {
    const room = this.sessionRoom(bookingId);
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.some((socket) => socket.data.userId === userId);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private panditRoom(panditId: string): string {
    return `pandit:${panditId}`;
  }

  private emitMediaPeerReady(
    client: ChatSocket,
    room: string,
    bookingId: string,
    format: 'audio' | 'video',
  ): void {
    const readyForJoiner: MediaPeerReadyPayload = {
      bookingId,
      format,
      initiator: true,
    };
    const readyForExistingParticipant: MediaPeerReadyPayload = {
      bookingId,
      format,
      initiator: false,
    };
    client.emit('mediaPeerReady', readyForJoiner);
    client.to(room).emit('mediaPeerReady', readyForExistingParticipant);
  }

  private isWebRtcSignal(
    signal: unknown,
  ): signal is MediaSignalPayload['signal'] {
    if (!signal || typeof signal !== 'object') return false;
    const record = signal as Record<string, unknown>;
    if (record.type === 'offer' || record.type === 'answer') {
      return typeof record.sdp === 'string' && record.sdp.length > 0;
    }
    return (
      record.type === 'ice-candidate' &&
      (record.candidate === null || typeof record.candidate === 'object')
    );
  }

  private sessionStartKey(bookingId: string): string {
    return `session:start:${bookingId}`;
  }

  private sessionEndKey(bookingId: string): string {
    return `session:end:${bookingId}`;
  }

  private sessionWaitingKey(bookingId: string): string {
    return `session:waiting:${bookingId}`;
  }

  private audioRoom(bookingId: string): string {
    return `audio:${bookingId}`;
  }

  private audioRoomKey(bookingId: string): string {
    return `audio:room:${bookingId}`;
  }

  private audioStartKey(bookingId: string): string {
    return `audio:start:${bookingId}`;
  }

  private audioEndKey(bookingId: string): string {
    return `audio:end:${bookingId}`;
  }

  private async addAudioRoomParticipant(
    bookingId: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.audioRoomKey(bookingId);
    const participants = (await this.cacheManager.get<string[]>(key)) ?? [];
    if (!participants.includes(userId)) {
      participants.push(userId);
    }
    await this.cacheManager.set(key, participants, ttlSeconds * 1000);
  }

  private async getAudioRoomParticipantCount(
    bookingId: string,
  ): Promise<number> {
    const participants =
      (await this.cacheManager.get<string[]>(this.audioRoomKey(bookingId))) ??
      [];
    return participants.length;
  }

  private async removeAudioRoomParticipant(
    bookingId: string,
    userId: string,
  ): Promise<void> {
    const key = this.audioRoomKey(bookingId);
    const participants = (await this.cacheManager.get<string[]>(key)) ?? [];
    const next = participants.filter((id) => id !== userId);
    if (next.length === 0) {
      await this.cacheManager.del(key);
      return;
    }
    const ttlSeconds = await this.getAudioRoomTtlSeconds(bookingId);
    await this.cacheManager.set(key, next, ttlSeconds * 1000);
  }

  private async getAudioRoomTtlSeconds(bookingId: string): Promise<number> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { durationMinutes: true },
    });
    return ((booking?.durationMinutes ?? 30) + 10) * 60;
  }

  private async hasAudioSessionStarted(bookingId: string): Promise<boolean> {
    if (this.audioSessionIntervals.has(bookingId)) {
      return true;
    }

    const startedAt = await this.cacheManager.get<number>(
      this.audioStartKey(bookingId),
    );
    return startedAt !== undefined && startedAt !== null;
  }

  private async startAudioTimer(
    bookingId: string,
    durationMinutes: number,
    startedAtMs: number,
  ): Promise<void> {
    if (this.audioSessionIntervals.has(bookingId)) {
      return;
    }

    const endTime = startedAtMs + durationMinutes * 60 * 1000;
    const ttlMs = (durationMinutes + 10) * 60 * 1000;

    await this.cacheManager.set(
      this.audioStartKey(bookingId),
      startedAtMs,
      ttlMs,
    );
    await this.cacheManager.set(this.audioEndKey(bookingId), endTime, ttlMs);

    this.startAudioSessionTimer(bookingId);
  }

  private startAudioSessionTimer(bookingId: string): void {
    if (this.audioSessionIntervals.has(bookingId)) {
      return;
    }

    const interval = setInterval(() => {
      void this.tickAudioSessionTimer(bookingId);
    }, TIMER_INTERVAL_MS);

    this.audioSessionIntervals.set(bookingId, interval);
  }

  private async tickAudioSessionTimer(bookingId: string): Promise<void> {
    await this.withDistributedLock(`lock:audio-timer:${bookingId}`, () =>
      this.tickAudioSessionTimerOwned(bookingId),
    );
  }

  private async tickAudioSessionTimerOwned(bookingId: string): Promise<void> {
    const endTime = await this.cacheManager.get<number>(
      this.audioEndKey(bookingId),
    );
    if (endTime === undefined || endTime === null) {
      return;
    }

    const sessionStarted = await this.hasAudioSessionStarted(bookingId);
    if (!sessionStarted) {
      return;
    }

    const secondsLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    const room = this.audioRoom(bookingId);

    this.server.to(room).emit('timeRemaining', { secondsLeft });

    if (
      secondsLeft <= FIVE_MINUTES_SECONDS &&
      (await this.claimOnce(this.audioWarningKey(bookingId), 15 * 60 * 1000))
    ) {
      this.server.to(room).emit('warningFiveMinutes', { bookingId });
    }

    if (secondsLeft <= 0) {
      this.server.to(room).emit('audioSessionTimeUp', { bookingId });
      this.clearAudioSessionTimer(bookingId);

      const payload: AudioSessionEndedPayload = { bookingId };
      this.server.to(room).emit('audioSessionEnded', payload);

      await this.finalizeAudioSession(bookingId);
    }
  }

  private async finalizeAudioSession(bookingId: string): Promise<void> {
    await this.notifySessionEnded(bookingId);

    try {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'completed' },
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to mark audio booking ${bookingId} completed: ${String(error)}`,
      );
    }

    await this.clearAudioSessionRedisKeys(bookingId);
  }

  private clearAudioSessionTimer(bookingId: string): void {
    const interval = this.audioSessionIntervals.get(bookingId);
    if (interval) {
      clearInterval(interval);
      this.audioSessionIntervals.delete(bookingId);
    }
  }

  private clearAudioWaitTimeout(bookingId: string): void {
    const timeout = this.audioWaitTimeouts.get(bookingId);
    if (timeout) {
      clearTimeout(timeout);
      this.audioWaitTimeouts.delete(bookingId);
    }
  }

  private async clearAudioSessionRedisKeys(bookingId: string): Promise<void> {
    await this.cacheManager.del(this.audioRoomKey(bookingId));
    await this.cacheManager.del(this.audioStartKey(bookingId));
    await this.cacheManager.del(this.audioEndKey(bookingId));
    await this.redisClient.del(this.audioWarningKey(bookingId));
    await this.redisClient.del(
      this.sessionNotificationKey('started', bookingId),
    );
    await this.redisClient.del(this.sessionNotificationKey('ended', bookingId));
  }

  private videoRoom(bookingId: string): string {
    return `video:${bookingId}`;
  }

  private videoRoomKey(bookingId: string): string {
    return `video:room:${bookingId}`;
  }

  private videoStartKey(bookingId: string): string {
    return `video:start:${bookingId}`;
  }

  private videoEndKey(bookingId: string): string {
    return `video:end:${bookingId}`;
  }

  private async addVideoRoomParticipant(
    bookingId: string,
    userId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.videoRoomKey(bookingId);
    const participants = (await this.cacheManager.get<string[]>(key)) ?? [];
    if (!participants.includes(userId)) {
      participants.push(userId);
    }
    await this.cacheManager.set(key, participants, ttlSeconds * 1000);
  }

  private async getVideoRoomParticipantCount(
    bookingId: string,
  ): Promise<number> {
    const participants =
      (await this.cacheManager.get<string[]>(this.videoRoomKey(bookingId))) ??
      [];
    return participants.length;
  }

  private async removeVideoRoomParticipant(
    bookingId: string,
    userId: string,
  ): Promise<void> {
    const key = this.videoRoomKey(bookingId);
    const participants = (await this.cacheManager.get<string[]>(key)) ?? [];
    const next = participants.filter((id) => id !== userId);
    if (next.length === 0) {
      await this.cacheManager.del(key);
      return;
    }
    const ttlSeconds = await this.getVideoRoomTtlSeconds(bookingId);
    await this.cacheManager.set(key, next, ttlSeconds * 1000);
  }

  private async getVideoRoomTtlSeconds(bookingId: string): Promise<number> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { durationMinutes: true },
    });
    return ((booking?.durationMinutes ?? 30) + 10) * 60;
  }

  private async hasVideoSessionStarted(bookingId: string): Promise<boolean> {
    if (this.videoSessionIntervals.has(bookingId)) {
      return true;
    }

    const startedAt = await this.cacheManager.get<number>(
      this.videoStartKey(bookingId),
    );
    return startedAt !== undefined && startedAt !== null;
  }

  private async startVideoTimer(
    bookingId: string,
    durationMinutes: number,
    startedAtMs: number,
  ): Promise<void> {
    if (this.videoSessionIntervals.has(bookingId)) {
      return;
    }

    const endTime = startedAtMs + durationMinutes * 60 * 1000;
    const ttlMs = (durationMinutes + 10) * 60 * 1000;

    await this.cacheManager.set(
      this.videoStartKey(bookingId),
      startedAtMs,
      ttlMs,
    );
    await this.cacheManager.set(this.videoEndKey(bookingId), endTime, ttlMs);

    this.startVideoSessionTimer(bookingId);
  }

  private startVideoSessionTimer(bookingId: string): void {
    if (this.videoSessionIntervals.has(bookingId)) {
      return;
    }

    const interval = setInterval(() => {
      void this.tickVideoSessionTimer(bookingId);
    }, TIMER_INTERVAL_MS);

    this.videoSessionIntervals.set(bookingId, interval);
  }

  private async tickVideoSessionTimer(bookingId: string): Promise<void> {
    await this.withDistributedLock(`lock:video-timer:${bookingId}`, () =>
      this.tickVideoSessionTimerOwned(bookingId),
    );
  }

  private async tickVideoSessionTimerOwned(bookingId: string): Promise<void> {
    const endTime = await this.cacheManager.get<number>(
      this.videoEndKey(bookingId),
    );
    if (endTime === undefined || endTime === null) {
      return;
    }

    const sessionStarted = await this.hasVideoSessionStarted(bookingId);
    if (!sessionStarted) {
      return;
    }

    const secondsLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    const room = this.videoRoom(bookingId);

    this.server.to(room).emit('timeRemaining', { secondsLeft });

    if (
      secondsLeft <= FIVE_MINUTES_SECONDS &&
      (await this.claimOnce(this.videoWarningKey(bookingId), 15 * 60 * 1000))
    ) {
      this.server.to(room).emit('warningFiveMinutes', { bookingId });
    }

    if (secondsLeft <= 0) {
      this.server.to(room).emit('videoSessionTimeUp', { bookingId });
      this.clearVideoSessionTimer(bookingId);

      const payload: VideoSessionEndedPayload = { bookingId };
      this.server.to(room).emit('videoSessionEnded', payload);

      await this.finalizeVideoSession(bookingId);
    }
  }

  private async finalizeVideoSession(bookingId: string): Promise<void> {
    await this.notifySessionEnded(bookingId);

    try {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'completed' },
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to mark video booking ${bookingId} completed: ${String(error)}`,
      );
    }

    await this.clearVideoSessionRedisKeys(bookingId);
  }

  private clearVideoSessionTimer(bookingId: string): void {
    const interval = this.videoSessionIntervals.get(bookingId);
    if (interval) {
      clearInterval(interval);
      this.videoSessionIntervals.delete(bookingId);
    }
  }

  private clearVideoWaitTimeout(bookingId: string): void {
    const timeout = this.videoWaitTimeouts.get(bookingId);
    if (timeout) {
      clearTimeout(timeout);
      this.videoWaitTimeouts.delete(bookingId);
    }
  }

  private async clearVideoSessionRedisKeys(bookingId: string): Promise<void> {
    await this.cacheManager.del(this.videoRoomKey(bookingId));
    await this.cacheManager.del(this.videoStartKey(bookingId));
    await this.cacheManager.del(this.videoEndKey(bookingId));
    await this.redisClient.del(this.videoWarningKey(bookingId));
    await this.redisClient.del(
      this.sessionNotificationKey('started', bookingId),
    );
    await this.redisClient.del(this.sessionNotificationKey('ended', bookingId));
  }

  private emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(this.userRoom(userId)).emit(event, payload);
  }

  private isChatNowBooking(booking: Booking): boolean {
    return (
      booking.format === 'chat' &&
      booking.depth === 'entry' &&
      booking.durationMinutes === 15 &&
      booking.coinsDeducted === 101
    );
  }

  private async claimOnce(key: string, ttlMs: number): Promise<boolean> {
    return this.redisClient.setIfAbsent(key, '1', ttlMs);
  }

  private sessionWarningKey(bookingId: string): string {
    return `session:warning:${bookingId}`;
  }

  private audioWarningKey(bookingId: string): string {
    return `audio:warning:${bookingId}`;
  }

  private videoWarningKey(bookingId: string): string {
    return `video:warning:${bookingId}`;
  }

  private sessionNotificationKey(
    kind: 'started' | 'ended',
    bookingId: string,
  ): string {
    return `session:notification:${kind}:${bookingId}`;
  }

  private async notifySessionStarted(
    bookingId: string,
    booking?: Booking,
  ): Promise<void> {
    const resolved =
      booking ??
      (await this.prisma.booking.findUnique({ where: { id: bookingId } }));
    if (!resolved) {
      return;
    }

    if (
      !(await this.claimOnce(
        this.sessionNotificationKey('started', bookingId),
        24 * 60 * 60 * 1000,
      ))
    ) {
      return;
    }

    await this.notificationsService.createNotification(
      resolved.userId,
      'session_started',
      'Session started',
      'Your consultation session has started.',
      bookingId,
    );

    if (this.isChatNowBooking(resolved)) {
      await this.notificationsService.createNotification(
        resolved.userId,
        'chat_now_accepted',
        'Pandit joined',
        'Your pandit has joined your Chat Now session.',
        bookingId,
      );
    }
  }

  private async notifySessionEnded(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return;
    }

    if (
      !(await this.claimOnce(
        this.sessionNotificationKey('ended', bookingId),
        24 * 60 * 60 * 1000,
      ))
    ) {
      return;
    }

    await this.notificationsService.createNotification(
      booking.userId,
      'session_ended',
      'Session ended',
      'Your consultation session has ended. We hope it was helpful!',
      bookingId,
    );
  }

  private async notifyChatNowMissed(booking: Booking): Promise<void> {
    if (!this.isChatNowBooking(booking)) {
      return;
    }

    await this.notificationsService.createNotification(
      booking.userId,
      'chat_now_missed',
      'Chat Now missed',
      'Your pandit could not join in time. A full refund has been issued to your wallet.',
      booking.id,
    );
  }

  private async notifyNewMessage(
    booking: BookingWithPandit,
    senderId: string,
    senderRole: SenderRole,
    message: string,
  ): Promise<void> {
    const recipientUserId =
      senderRole === 'pandit' ? booking.userId : booking.pandit.userId;

    if (!recipientUserId) {
      return;
    }

    if (await this.isUserInSessionRoom(recipientUserId, booking.id)) {
      return;
    }

    const preview =
      message.length > 80 ? `${message.slice(0, 77)}...` : message;

    await this.notificationsService.createNotification(
      recipientUserId,
      'new_message',
      'New message',
      preview,
      booking.id,
    );
  }

  private async isBookingPandit(
    userId: string,
    booking: Booking,
  ): Promise<boolean> {
    const pandit = await this.prisma.pandit.findUnique({ where: { userId } });
    return pandit !== null && pandit.id === booking.panditId;
  }

  private async authenticateClient(
    client: ChatSocket,
    payloadToken?: string,
  ): Promise<string> {
    const handshakeToken = client.handshake.auth?.token;
    const token =
      typeof handshakeToken === 'string' && handshakeToken.length > 0
        ? handshakeToken
        : payloadToken;

    if (!token) {
      throw new Error('Authentication token is required');
    }

    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    if (!payload?.sub) {
      throw new Error('Invalid token payload');
    }

    client.data.userId = payload.sub;
    await client.join(this.userRoom(payload.sub));
    return payload.sub;
  }

  private async requireAuthenticatedUser(client: ChatSocket): Promise<string> {
    if (client.data.userId) {
      return client.data.userId;
    }

    const handshakeToken = client.handshake.auth?.token;
    if (typeof handshakeToken === 'string' && handshakeToken.length > 0) {
      return this.authenticateClient(client);
    }

    throw new Error('Authentication required');
  }

  private async loadBookingForParticipant(
    bookingId: string,
    userId: string,
  ): Promise<BookingWithPandit> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pandit: { select: { userId: true } },
      },
    });

    if (!booking) {
      throw new Error(`Booking with id "${bookingId}" not found`);
    }

    const isParticipant =
      booking.userId === userId || booking.pandit.userId === userId;

    if (!isParticipant) {
      throw new Error('You are not a participant in this booking');
    }

    return booking;
  }

  private resolveSenderRole(
    userId: string,
    booking: BookingWithPandit,
  ): SenderRole {
    return booking.pandit.userId === userId ? 'pandit' : 'user';
  }

  private async getSessionStartedAtMs(
    bookingId: string,
    format: string,
  ): Promise<number | null> {
    let key: string;
    if (format === 'chat') {
      key = this.sessionStartKey(bookingId);
    } else if (format === 'audio') {
      key = this.audioStartKey(bookingId);
    } else if (format === 'video') {
      key = this.videoStartKey(bookingId);
    } else {
      return null;
    }

    const startedAt = await this.cacheManager.get<number>(key);
    if (startedAt === undefined || startedAt === null) {
      return null;
    }
    return startedAt;
  }

  private async isWithinGracePeriod(
    bookingId: string,
    format: string,
  ): Promise<boolean> {
    const startedAt = await this.getSessionStartedAtMs(bookingId, format);
    if (startedAt === null) {
      return false;
    }
    return Date.now() - startedAt <= SESSION_GRACE_PERIOD_MS;
  }

  private async handleGraceRefund(
    bookingId: string,
    booking: BookingWithPandit,
    requestingClient?: ChatSocket,
  ): Promise<void> {
    const format = booking.format;
    this.clearPanditReconnectTimeout(bookingId);

    const result = await this.bookingsService.cancelWithRefund(
      bookingId,
      'Session refund — user grace period',
    );

    const graceMessage =
      'The user ended this session during the 90-second trial period. This booking has been cancelled.';
    const gracePayload: SessionGraceEndedPayload = {
      bookingId,
      message: graceMessage,
    };

    let refundPayload: SessionRefundedPayload | null = null;
    if (result.applied) {
      refundPayload = {
        reason: 'grace_period',
        coinsRefunded: result.coinsRefunded,
        message: `A full refund of ${result.coinsRefunded} coins has been issued to your wallet.`,
      };
    }

    const emitRefund = (room: string) => {
      if (!refundPayload) return;
      requestingClient?.emit('sessionRefunded', refundPayload);
      this.server.to(room).emit('sessionRefunded', refundPayload);
    };

    const emitGraceEnded = (room: string) => {
      requestingClient?.emit('sessionGraceEnded', gracePayload);
      this.server.to(room).emit('sessionGraceEnded', gracePayload);
    };

    if (format === 'chat') {
      const room = this.sessionRoom(bookingId);
      emitRefund(room);
      emitGraceEnded(room);
      await this.cleanupSession(bookingId, booking.panditId);
      return;
    }

    if (format === 'audio') {
      this.clearAudioWaitTimeout(bookingId);
      this.clearAudioSessionTimer(bookingId);
      const room = this.audioRoom(bookingId);
      emitRefund(room);
      emitGraceEnded(room);
      this.server.to(room).emit('audioSessionEnded', { bookingId });
      await this.clearAudioSessionRedisKeys(bookingId);
      await this.panditAvailability.clearPanditActive(booking.panditId);
      return;
    }

    if (format === 'video') {
      this.clearVideoWaitTimeout(bookingId);
      this.clearVideoSessionTimer(bookingId);
      const room = this.videoRoom(bookingId);
      emitRefund(room);
      emitGraceEnded(room);
      this.server.to(room).emit('videoSessionEnded', { bookingId });
      await this.clearVideoSessionRedisKeys(bookingId);
      await this.panditAvailability.clearPanditActive(booking.panditId);
    }
  }

  private async handleAvSocketDisconnect(
    bookingId: string,
    userId: string,
    kind: 'audio' | 'video',
  ): Promise<void> {
    if (kind === 'audio') {
      await this.removeAudioRoomParticipant(bookingId, userId);
    } else {
      await this.removeVideoRoomParticipant(bookingId, userId);
    }

    this.scheduleAvDisconnectGrace(bookingId, userId, kind);
  }

  private avDisconnectGraceKey(
    kind: 'audio' | 'video',
    bookingId: string,
    userId: string,
  ): string {
    return `${kind}:${bookingId}:${userId}`;
  }

  private clearAvDisconnectGraceTimeout(
    kind: 'audio' | 'video',
    bookingId: string,
    userId: string,
  ): void {
    const key = this.avDisconnectGraceKey(kind, bookingId, userId);
    const timeout = this.avDisconnectGraceTimeouts.get(key);
    if (!timeout) {
      return;
    }
    clearTimeout(timeout);
    this.avDisconnectGraceTimeouts.delete(key);
  }

  private scheduleAvDisconnectGrace(
    bookingId: string,
    userId: string,
    kind: 'audio' | 'video',
  ): void {
    const key = this.avDisconnectGraceKey(kind, bookingId, userId);
    this.clearAvDisconnectGraceTimeout(kind, bookingId, userId);

    const timeout = setTimeout(() => {
      this.avDisconnectGraceTimeouts.delete(key);
      void this.emitAvParticipantLeftAfterGrace(bookingId, userId, kind);
    }, AV_DISCONNECT_GRACE_MS);

    this.avDisconnectGraceTimeouts.set(key, timeout);
  }

  private notifyAvParticipantRejoined(
    client: ChatSocket,
    bookingId: string,
    kind: 'audio' | 'video',
  ): void {
    const room =
      kind === 'audio' ? this.audioRoom(bookingId) : this.videoRoom(bookingId);
    const event =
      kind === 'audio'
        ? 'audioParticipantRejoined'
        : 'videoParticipantRejoined';
    const payload =
      kind === 'audio'
        ? ({ bookingId } satisfies AudioParticipantRejoinedPayload)
        : ({ bookingId } satisfies VideoParticipantRejoinedPayload);
    client.to(room).emit(event, payload);
  }

  private async emitAvParticipantLeftAfterGrace(
    bookingId: string,
    userId: string,
    kind: 'audio' | 'video',
  ): Promise<void> {
    const room =
      kind === 'audio' ? this.audioRoom(bookingId) : this.videoRoom(bookingId);

    const leftPayload =
      kind === 'audio'
        ? ({ bookingId } satisfies AudioParticipantLeftPayload)
        : ({ bookingId } satisfies VideoParticipantLeftPayload);
    const leftEvent =
      kind === 'audio' ? 'audioParticipantLeft' : 'videoParticipantLeft';
    this.server.to(room).emit(leftEvent, leftPayload);

    const sessionStarted =
      kind === 'audio'
        ? await this.hasAudioSessionStarted(bookingId)
        : await this.hasVideoSessionStarted(bookingId);
    const participantCount =
      kind === 'audio'
        ? await this.getAudioRoomParticipantCount(bookingId)
        : await this.getVideoRoomParticipantCount(bookingId);

    if (!sessionStarted && participantCount < 2) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { pandit: { select: { userId: true } } },
      });
      const waitingForRole: SenderRole =
        booking && booking.pandit.userId === userId ? 'user' : 'pandit';
      const waitingEvent =
        kind === 'audio' ? 'audioWaitingForOther' : 'videoWaitingForOther';
      const waitingPayload =
        kind === 'audio'
          ? ({
              bookingId,
              waitingForRole,
            } satisfies AudioWaitingForOtherPayload)
          : ({
              bookingId,
              waitingForRole,
            } satisfies VideoWaitingForOtherPayload);
      this.server.to(room).emit(waitingEvent, waitingPayload);
    }
  }

  private emitError(client: ChatSocket, error: unknown): void {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    this.logger.warn(`Chat error for client ${client.id}: ${message}`);
    client.emit('error', { message });
  }
}
