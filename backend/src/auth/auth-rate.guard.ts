import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
@Injectable()
export class AuthRateGuard implements CanActivate {
  private readonly attempts = new Map<
    string,
    { count: number; expires: number }
  >();
  canActivate(context: ExecutionContext): boolean {
    const now = Date.now();
    for (const [key, value] of this.attempts)
      if (value.expires <= now) this.attempts.delete(key);
    const request = context.switchToHttp().getRequest<{ ip?: string }>();
    const key = request.ip ?? 'unknown';
    const attempt = this.attempts.get(key);
    if (attempt && attempt.count >= 10)
      throw new HttpException(
        'Too many attempts. Try again in one minute.',
        429,
      );
    if (attempt) attempt.count++;
    else {
      if (this.attempts.size >= 10000)
        throw new HttpException('Please try again later.', 429);
      this.attempts.set(key, { count: 1, expires: now + 60000 });
    }
    return true;
  }
}
