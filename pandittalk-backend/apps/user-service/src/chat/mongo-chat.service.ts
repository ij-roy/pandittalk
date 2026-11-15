import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, MongoClient } from 'mongodb';
import type { ChatStorage } from './chat-storage.interface';
import { chronologicalWindow } from './chat-history-window';
import type { ChatMessage, SenderRole } from './types/chat.types';

const DEFAULT_MESSAGE_LIMIT = 100;
const CHAT_COLLECTION = 'chat_messages';

@Injectable()
export class MongoChatService
  implements ChatStorage, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MongoChatService.name);
  private readonly client: MongoClient;
  private readonly databaseName: string;
  private collection?: Collection<ChatMessage>;

  constructor(private readonly configService: ConfigService) {
    const uri = this.configService.get<string>('MONGODB_URI')?.trim();
    if (!uri) {
      throw new Error('MONGODB_URI is not configured');
    }

    this.databaseName = this.configService.get<string>(
      'MONGODB_DATABASE',
      'pandittalk',
    );
    this.client = new MongoClient(uri);
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.collection = this.client
      .db(this.databaseName)
      .collection<ChatMessage>(CHAT_COLLECTION);
    await this.collection.createIndex({ sessionId: 1, timestamp: -1 });
    this.logger.log(
      `MongoDB chat collection "${this.databaseName}.${CHAT_COLLECTION}" is ready`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  async ping(): Promise<void> {
    await this.client.db(this.databaseName).command({ ping: 1 });
  }

  async saveMessage(
    sessionId: string,
    senderId: string,
    senderRole: SenderRole,
    message: string,
    timestamp: number,
  ): Promise<void> {
    await this.getCollection().insertOne({
      sessionId,
      senderId,
      senderRole,
      message,
      timestamp,
    });
  }

  async getMessageWindow(
    sessionId: string,
    options?: { beforeTimestamp?: number; limit?: number },
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
    const limit = this.normalizeLimit(options?.limit);
    const before = options?.beforeTimestamp;
    const hasBefore = before != null && Number.isFinite(before);
    const filter = hasBefore
      ? { sessionId, timestamp: { $lt: before } }
      : { sessionId };

    const newestFirst = await this.getCollection()
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit + 1)
      .toArray();
    const hasMore = newestFirst.length > limit;
    const window = chronologicalWindow(newestFirst.slice(0, limit), hasMore);
    return { messages: window.items, hasMore: window.hasMore };
  }

  async getMessages(
    sessionId: string,
    limit: number = DEFAULT_MESSAGE_LIMIT,
  ): Promise<ChatMessage[]> {
    const window = await this.getMessageWindow(sessionId, { limit });
    return window.messages;
  }

  private getCollection(): Collection<ChatMessage> {
    if (!this.collection) {
      throw new Error('MongoDB chat storage is not initialized');
    }
    return this.collection;
  }

  private normalizeLimit(limit?: number): number {
    if (!Number.isInteger(limit) || limit == null || limit <= 0) {
      return DEFAULT_MESSAGE_LIMIT;
    }
    return Math.min(limit, 500);
  }
}
