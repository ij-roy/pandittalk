import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { PanditServiceModule } from './../src/pandit-service.module';

describe('PanditServiceController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PanditServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
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
        expect(body.service).toBe('pandit-service');
        expect(typeof body.timestamp).toBe('string');
      });
  });
});
