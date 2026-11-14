import {
  ChimeSDKMeetingsClient,
  CreateAttendeeCommand,
  CreateMeetingCommand,
  DeleteMeetingCommand,
  NotFoundException as ChimeNotFoundException,
  type Attendee,
  type Meeting,
} from '@aws-sdk/client-chime-sdk-meetings';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';

interface ChimeMeetingCache {
  meeting: Meeting;
  attendees: Record<string, Attendee>;
  ttlMs: number;
}

@Injectable()
export class ChimeService {
  private readonly client: ChimeSDKMeetingsClient;

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    const accessKeyId =
      this.configService.get<string>('AWS_CHIME_ACCESS_KEY_ID') ??
      this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey =
      this.configService.get<string>('AWS_CHIME_SECRET_ACCESS_KEY') ??
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    const region = this.configService.get<string>('AWS_REGION', 'ap-south-1');
    this.client = new ChimeSDKMeetingsClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }

  async createMeeting(
    bookingId: string,
    durationMinutes: number,
  ): Promise<Meeting> {
    try {
      const response = await this.client.send(
        new CreateMeetingCommand({
          ClientRequestToken: bookingId,
          MediaRegion: 'ap-south-1',
          ExternalMeetingId: bookingId,
        }),
      );

      const meeting = response.Meeting;
      if (!meeting) {
        throw new InternalServerErrorException(
          'Chime CreateMeeting returned no meeting',
        );
      }

      const ttlMs = (durationMinutes * 60 + 1800) * 1000;
      await this.cacheManager.set(
        this.meetingKey(bookingId),
        { meeting, attendees: {}, ttlMs } satisfies ChimeMeetingCache,
        ttlMs,
      );

      return meeting;
    } catch (error: unknown) {
      this.rethrowChimeError(error);
    }
  }

  async createAttendee(
    bookingId: string,
    userId: string,
    durationMinutes: number,
  ): Promise<Attendee> {
    let cache = await this.getCache(bookingId);

    const existing = cache.attendees[userId];
    if (existing) {
      return existing;
    }

    try {
      return await this.createAttendeeInternal(bookingId, userId, cache);
    } catch (error: unknown) {
      if (this.isChimeMeetingNotFound(error)) {
        await this.cacheManager.del(this.meetingKey(bookingId));
        await this.createMeeting(bookingId, durationMinutes);
        cache = await this.getCache(bookingId);
        return await this.createAttendeeInternal(bookingId, userId, cache);
      }
      this.rethrowChimeError(error);
    }
  }

  private async createAttendeeInternal(
    bookingId: string,
    userId: string,
    cache: ChimeMeetingCache,
  ): Promise<Attendee> {
    const response = await this.client.send(
      new CreateAttendeeCommand({
        MeetingId: cache.meeting.MeetingId,
        ExternalUserId: userId,
      }),
    );

    const attendee = response.Attendee;
    if (!attendee) {
      throw new InternalServerErrorException(
        'Chime CreateAttendee returned no attendee',
      );
    }

    cache.attendees[userId] = attendee;
    await this.cacheManager.set(
      this.meetingKey(bookingId),
      cache,
      cache.ttlMs,
    );

    return attendee;
  }

  async getMeeting(
    bookingId: string,
  ): Promise<{ meeting: Meeting; attendees: Record<string, Attendee> }> {
    const cache = await this.getCache(bookingId);
    return { meeting: cache.meeting, attendees: cache.attendees };
  }

  async ensureMeeting(
    bookingId: string,
    durationMinutes: number,
  ): Promise<Meeting> {
    try {
      const { meeting } = await this.getMeeting(bookingId);
      return meeting;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
      return this.createMeeting(bookingId, durationMinutes);
    }
  }

  async endMeeting(bookingId: string): Promise<void> {
    const cache = await this.getCache(bookingId);

    try {
      await this.client.send(
        new DeleteMeetingCommand({
          MeetingId: cache.meeting.MeetingId,
        }),
      );
    } catch (error) {
      if (!(error instanceof ChimeNotFoundException)) {
        this.rethrowChimeError(error);
      }
    }

    await this.cacheManager.del(this.meetingKey(bookingId));
  }

  private meetingKey(bookingId: string): string {
    return `chime:meeting:${bookingId}`;
  }

  private async getCache(bookingId: string): Promise<ChimeMeetingCache> {
    const cache = await this.cacheManager.get<ChimeMeetingCache>(
      this.meetingKey(bookingId),
    );
    if (!cache) {
      throw new NotFoundException('Chime meeting not found');
    }
    return cache;
  }

  private isChimeMeetingNotFound(error: unknown): boolean {
    if (error instanceof ChimeNotFoundException) {
      return true;
    }
    if (error instanceof Error && error.name === 'NotFoundException') {
      return true;
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'Code' in error &&
      (error as { Code?: string }).Code === 'NotFound'
    ) {
      return true;
    }
    return false;
  }

  private rethrowChimeError(error: unknown): never {
    if (
      error instanceof Error &&
      (error.name === 'UnrecognizedClientException' ||
        error.name === 'InvalidClientTokenId' ||
        error.name === 'SignatureDoesNotMatch')
    ) {
      throw new ServiceUnavailableException(
        'AWS Chime credentials are invalid or missing. Check AWS_CHIME_ACCESS_KEY_ID and AWS_CHIME_SECRET_ACCESS_KEY in .env.',
      );
    }
    if (this.isChimeMeetingNotFound(error)) {
      throw new NotFoundException(
        'Chime meeting expired — please rejoin the session',
      );
    }
    throw error;
  }
}
