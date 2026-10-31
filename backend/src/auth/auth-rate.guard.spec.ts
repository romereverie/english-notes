import { ExecutionContext } from '@nestjs/common';
import { AuthRateGuard } from './auth-rate.guard';
import { jwtSecret } from './jwt.config';
describe('Authentication configuration', () => {
  it('requires a strong configured secret', () => {
    const previous = process.env.JWT_SECRET;
    try {
      delete process.env.JWT_SECRET;
      expect(jwtSecret).toThrow();
      process.env.JWT_SECRET = 'short';
      expect(jwtSecret).toThrow();
    } finally {
      if (previous === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previous;
    }
  });
  it('limits attempts per IP and allows retry after expiry', () => {
    jest.useFakeTimers();
    try {
      const guard = new AuthRateGuard();
      const context = {
        switchToHttp: () => ({ getRequest: () => ({ ip: '127.0.0.1' }) }),
      } as ExecutionContext;
      for (let i = 0; i < 10; i++)
        expect(guard.canActivate(context)).toBe(true);
      expect(() => guard.canActivate(context)).toThrow();
      jest.advanceTimersByTime(60001);
      expect(guard.canActivate(context)).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});
