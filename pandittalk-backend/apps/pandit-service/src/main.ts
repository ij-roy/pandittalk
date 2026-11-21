import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { resolveServicePort } from '@pandittalk/common';
import { PanditServiceModule } from './pandit-service.module';

async function bootstrap() {
  const app = await NestFactory.create(PanditServiceModule);

  // Optional but recommended: Enable CORS if you run into fetching issues later
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = resolveServicePort(
    configService.get<string>('PORT'),
    configService.get<string>('PANDIT_SERVICE_PORT'),
    3002,
  );

  // The crucial fix: Add '0.0.0.0'
  await app.listen(port, '0.0.0.0');
  Logger.log(`pandit-service listening on ${port}`, 'Bootstrap');
}
void bootstrap();
