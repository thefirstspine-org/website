import { AccountMiddleware } from './account.middleware';

describe('AccountMiddleware', () => {
  it('should be defined', () => {
    expect(new AccountMiddleware()).toBeDefined();
  });
});
