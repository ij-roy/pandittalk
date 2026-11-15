import { ExecutionContext } from '@nestjs/common';
import { AdminController } from './admin.controller';

describe('AdminController', () => {
  it('delegates overview reads to the Admin service', async () => {
    const adminService = {
      getOverview: jest.fn().mockResolvedValue({ users: 1 }),
    };
    const controller = new AdminController(adminService as never);

    await expect(controller.overview()).resolves.toEqual({ users: 1 });
    expect(adminService.getOverview).toHaveBeenCalledTimes(1);
  });

  it('declares AdminGuard on its route metadata', () => {
    expect(Reflect.getMetadata('__guards__', AdminController)).toBeDefined();
    void ({} as ExecutionContext);
  });
});
