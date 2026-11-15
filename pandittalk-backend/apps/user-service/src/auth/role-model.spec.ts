import { USER_ROLES } from './types/user-role';

describe('dashboard roles', () => {
  it('exposes the three supported roles', () => {
    expect(USER_ROLES).toEqual(['CUSTOMER', 'PANDIT', 'ADMIN']);
  });
});
