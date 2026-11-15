import { ConfigService } from '@nestjs/config';
import { MongoClient } from 'mongodb';
import { MongoChatService } from './mongo-chat.service';

describe('MongoChatService', () => {
  const connect = jest
    .spyOn(MongoClient.prototype, 'connect')
    .mockResolvedValue(MongoClient.prototype);
  const close = jest
    .spyOn(MongoClient.prototype, 'close')
    .mockResolvedValue(undefined);
  const dbCommand = jest.fn().mockResolvedValue({ ok: 1 });
  const createIndex = jest.fn().mockResolvedValue('sessionId_1_timestamp_-1');
  const insertOne = jest.fn().mockResolvedValue({ acknowledged: true });
  const toArray = jest.fn();
  const limit = jest.fn(() => ({ toArray }));
  const sort = jest.fn(() => ({ limit }));
  const find = jest.fn(() => ({ sort }));
  const collection = {
    createIndex,
    insertOne,
    find,
  };
  const db = {
    collection: jest.fn(() => collection),
    command: dbCommand,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(MongoClient.prototype, 'db').mockReturnValue(db as never);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('connects, creates the chat index, saves messages, and pings MongoDB', async () => {
    const service = new MongoChatService(
      new ConfigService({
        MONGODB_URI: 'mongodb://mongo.example.test:27017',
        MONGODB_DATABASE: 'pandittalk',
      }),
    );

    await service.onModuleInit();
    await service.saveMessage(
      'booking-1',
      'user-1',
      'user',
      'Namaste',
      100,
    );
    await service.ping();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(createIndex).toHaveBeenCalledWith({ sessionId: 1, timestamp: -1 });
    expect(insertOne).toHaveBeenCalledWith({
      sessionId: 'booking-1',
      senderId: 'user-1',
      senderRole: 'user',
      message: 'Namaste',
      timestamp: 100,
    });
    expect(dbCommand).toHaveBeenCalledWith({ ping: 1 });
  });

  it('returns an older window chronologically and reports whether more messages exist', async () => {
    toArray.mockResolvedValue([
      {
        sessionId: 'booking-1',
        senderId: 'user-3',
        senderRole: 'user',
        message: 'third',
        timestamp: 300,
      },
      {
        sessionId: 'booking-1',
        senderId: 'pandit-1',
        senderRole: 'pandit',
        message: 'second',
        timestamp: 200,
      },
      {
        sessionId: 'booking-1',
        senderId: 'user-1',
        senderRole: 'user',
        message: 'first',
        timestamp: 100,
      },
    ]);

    const service = new MongoChatService(
      new ConfigService({
        MONGODB_URI: 'mongodb://mongo.example.test:27017',
      }),
    );
    await service.onModuleInit();

    const result = await service.getMessageWindow('booking-1', {
      beforeTimestamp: 400,
      limit: 2,
    });

    expect(find).toHaveBeenCalledWith({
      sessionId: 'booking-1',
      timestamp: { $lt: 400 },
    });
    expect(sort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(limit).toHaveBeenCalledWith(3);
    expect(result).toEqual({
      messages: [
        {
          sessionId: 'booking-1',
          senderId: 'pandit-1',
          senderRole: 'pandit',
          message: 'second',
          timestamp: 200,
        },
        {
          sessionId: 'booking-1',
          senderId: 'user-3',
          senderRole: 'user',
          message: 'third',
          timestamp: 300,
        },
      ],
      hasMore: true,
    });
  });

  it('closes the Mongo client when the module is destroyed', async () => {
    const service = new MongoChatService(
      new ConfigService({ MONGODB_URI: 'mongodb://mongo.example.test:27017' }),
    );

    await service.onModuleDestroy();

    expect(close).toHaveBeenCalledTimes(1);
  });
});
