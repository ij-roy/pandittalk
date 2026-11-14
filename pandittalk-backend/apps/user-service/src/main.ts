import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { join } from 'path';
import { parseAllowedOrigins } from './config/cors-origins';
import { RedisIoAdapter } from './redis/redis-io.adapter';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(UserServiceModule, {
    bodyParser: false,
  });

  app.set('trust proxy', 1);

  const configService = app.get(ConfigService);
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.enableShutdownHooks();
  app.getHttpServer().on('close', () => {
    void redisIoAdapter.close();
  });

  const avatarUploadDir = configService.get<string>(
    'AVATAR_UPLOAD_DIR',
    'uploads/avatars',
  );
  app.useStaticAssets(join(process.cwd(), avatarUploadDir), {
    prefix: '/static/avatars',
  });

  app.use('/wallet/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const httpServer = app.getHttpAdapter().getInstance();
  httpServer.set('etag', false);
  app.use(
    (_req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private',
      );
      next();
    },
  );

  const allowedOrigins = parseAllowedOrigins(
    configService.get<string>('ALLOWED_ORIGINS'),
  );

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = Number(configService.get('USER_SERVICE_PORT', 3001));

  await app.listen(port, '0.0.0.0');
  Logger.log(`user-service listening on 0.0.0.0:${port}`, 'Bootstrap');
}
void bootstrap();
