import { normalizePrismaRuntimeUrl } from './prisma.service';

describe('normalizePrismaRuntimeUrl', () => {
  it('uses Supabase transaction pooling with a single Prisma connection', () => {
    const result = normalizePrismaRuntimeUrl(
      'postgresql://user:password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require&schema=public&connection_limit=10&pool_timeout=20',
    );

    const url = new URL(result);

    expect(url.port).toBe('6543');
    expect(url.searchParams.get('connection_limit')).toBe('1');
    expect(url.searchParams.get('pool_timeout')).toBe('20');
    expect(url.searchParams.get('pgbouncer')).toBe('true');
    expect(url.searchParams.get('schema')).toBe('public');
  });

  it('does not rewrite non-Supabase database URLs', () => {
    const input =
      'postgresql://user:password@localhost:5432/pandittalk?schema=public';

    expect(normalizePrismaRuntimeUrl(input)).toBe(input);
  });
});
