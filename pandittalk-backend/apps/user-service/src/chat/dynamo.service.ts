import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChatMessage, SenderRole } from './types/chat.types';
import { chronologicalWindow } from './chat-history-window';

const DEFAULT_MESSAGE_LIMIT = 100;

@Injectable()
export class DynamoService implements OnModuleInit {
  private readonly logger = new Logger(DynamoService.name);
  private readonly client: DynamoDBClient;
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    const region = this.configService.get<string>('AWS_REGION', 'ap-south-1');
    const endpoint = this.configService.get<string>('DYNAMODB_ENDPOINT');
    this.tableName = this.configService.get<string>(
      'DYNAMODB_TABLE_CHAT',
      'pandittalk-chat-messages',
    );

    this.client = new DynamoDBClient({
      region,
      ...(endpoint ? { endpoint } : {}),
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

  async onModuleInit(): Promise<void> {
    await this.ensureTableExists();
  }

  async saveMessage(
    sessionId: string,
    senderId: string,
    senderRole: SenderRole,
    message: string,
    timestamp: number,
  ): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          sessionId,
          timestamp,
          senderId,
          senderRole,
          message,
        },
      }),
    );
  }

  async getMessageWindow(
    sessionId: string,
    options?: { beforeTimestamp?: number; limit?: number },
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
    const limit = options?.limit ?? DEFAULT_MESSAGE_LIMIT;
    const before = options?.beforeTimestamp;
    const hasBefore = before != null && Number.isFinite(before);
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: hasBefore
          ? 'sessionId = :sessionId AND #ts < :before'
          : 'sessionId = :sessionId',
        ...(hasBefore
          ? { ExpressionAttributeNames: { '#ts': 'timestamp' } }
          : {}),
        ExpressionAttributeValues: {
          ':sessionId': sessionId,
          ...(hasBefore ? { ':before': before } : {}),
        },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );

    const newestFirst = (result.Items ?? []).map((item) => ({
      sessionId: item.sessionId as string,
      senderId: item.senderId as string,
      senderRole: item.senderRole as SenderRole,
      message: item.message as string,
      timestamp: item.timestamp as number,
    }));
    const window = chronologicalWindow(
      newestFirst,
      result.LastEvaluatedKey != null,
    );
    return { messages: window.items, hasMore: window.hasMore };
  }

  async getMessages(
    sessionId: string,
    limit: number = DEFAULT_MESSAGE_LIMIT,
  ): Promise<ChatMessage[]> {
    const window = await this.getMessageWindow(sessionId, { limit });
    return window.messages;
  }

  private async ensureTableExists(): Promise<void> {
    try {
      await this.client.send(
        new DescribeTableCommand({ TableName: this.tableName }),
      );
      this.logger.log(`DynamoDB table "${this.tableName}" is ready`);
      return;
    } catch (error: unknown) {
      if (!(error instanceof ResourceNotFoundException)) {
        throw error;
      }
    }

    this.logger.log(`Creating DynamoDB table "${this.tableName}"...`);
    await this.client.send(
      new CreateTableCommand({
        TableName: this.tableName,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          { AttributeName: 'sessionId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' },
        ],
        KeySchema: [
          { AttributeName: 'sessionId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
      }),
    );

    await this.waitForTableActive();
    this.logger.log(`DynamoDB table "${this.tableName}" created`);
  }

  private async waitForTableActive(): Promise<void> {
    const maxAttempts = 30;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const result = await this.client.send(
        new DescribeTableCommand({ TableName: this.tableName }),
      );
      if (result.Table?.TableStatus === 'ACTIVE') {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error(
      `DynamoDB table "${this.tableName}" did not become ACTIVE in time`,
    );
  }
}
