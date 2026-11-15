import { ConfigService } from '@nestjs/config';

export function buildRedisUrl(config: ConfigService): string {
  const configuredUrl = config.get<string>('REDIS_URL')?.trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('REDIS_URL is required in production');
  }

  const host = config.get<string>('REDIS_HOST', 'localhost');
  const port = config.get<string>('REDIS_PORT', '6379');
  return `redis://${host}:${port}`;
}
