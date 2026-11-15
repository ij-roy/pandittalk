import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';

describe('AuthController.me', () => {
  it('returns the server-authenticated user record', async () => {
    const authService = {
      getAuthenticatedUser: jest.fn().mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
      }),
    };
    const controller = new AuthController(
      authService as never,
      { get: jest.fn() } as unknown as ConfigService,
    );

    await expect(controller.me('admin-1')).resolves.toEqual({
      id: 'admin-1',
      role: 'ADMIN',
    });
    expect(authService.getAuthenticatedUser).toHaveBeenCalledWith('admin-1');
  });
});
