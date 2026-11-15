import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, type RedisClientType } from 'redis';
import type { Server, ServerOptions } from 'socket.io';
import { buildRedisUrl } from './redis-url';

export { buildRedisUrl } from './redis-url';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private pubClient?: RedisClientType;
  private subClient?: RedisClientType;

  constructor(
    app: INestApplication,
    private readonly config: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const url = buildRedisUrl(this.config);
    this.pubClient = createClient({ url });
    this.subClient = this.pubClient.duplicate();

    this.pubClient.on('error', (error) => {
      this.logger.error('Socket.IO Redis publisher error', error);
    });
    this.subClient.on('error', (error) => {
      this.logger.error('Socket.IO Redis subscriber error', error);
    });

    await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
    this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
    this.logger.log('Socket.IO Redis adapter connected');
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;

    if (!this.adapterConstructor) {
      throw new Error(
        'RedisIoAdapter.connectToRedis() must run before creating Socket.IO servers',
      );
    }

    server.adapter(this.adapterConstructor);
    return server;
  }

  async close(): Promise<void> {
    await Promise.all([
      this.quitClient(this.pubClient),
      this.quitClient(this.subClient),
    ]);
  }

  private async quitClient(client?: RedisClientType): Promise<void> {
    if (client?.isOpen) {
      await client.quit();
    }
  }
}
