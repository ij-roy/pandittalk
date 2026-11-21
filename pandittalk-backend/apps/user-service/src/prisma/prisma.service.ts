import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export function normalizePrismaRuntimeUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);

  if (!url.hostname.endsWith('.pooler.supabase.com')) {
    return databaseUrl;
  }

  // Render runs one web process, while Supabase's session pool has a small
  // client limit. Transaction pooling keeps the process from consuming a
  // dedicated database session for every Prisma connection.
  url.port = '6543';
  url.searchParams.set('connection_limit', '1');
  url.searchParams.set('pgbouncer', 'true');
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', '20');
  }

  return url.toString();
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    super(
      databaseUrl
        ? {
            datasources: {
              db: {
                url: normalizePrismaRuntimeUrl(databaseUrl),
              },
            },
          }
        : undefined,
    );
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
