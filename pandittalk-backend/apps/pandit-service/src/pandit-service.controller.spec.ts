import { Test, TestingModule } from '@nestjs/testing';
import { PanditServiceController } from './pandit-service.controller';
import { PanditServiceService } from './pandit-service.service';

describe('PanditServiceController', () => {
  let panditServiceController: PanditServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PanditServiceController],
      providers: [PanditServiceService],
    }).compile();

    panditServiceController = app.get<PanditServiceController>(
      PanditServiceController,
    );
  });

  describe('root', () => {
    it('should return health payload', () => {
      const body = panditServiceController.getHealth();
      expect(body.status).toBe('ok');
      expect(body.service).toBe('pandit-service');
      expect(typeof body.timestamp).toBe('string');
    });
  });
});
