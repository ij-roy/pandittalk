import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserServiceModule } from './../src/user-service.module';

function createPrismaMock(): Partial<PrismaService> {
  return {
    onModuleInit: () => Promise.resolve(),
    onModuleDestroy: () => Promise.resolve(),
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
  };
}

describe('UserServiceController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserServiceModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer() as Server)
      .get('/')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          status: string;
          service: string;
          timestamp: string;
        };
        expect(body.status).toBe('ok');
        expect(body.service).toBe('user-service');
        expect(typeof body.timestamp).toBe('string');
      });
  });
});
