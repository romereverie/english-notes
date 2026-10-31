import { jwtSecret } from '../jwt.config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret(),
    });
  }

  validate(payload: { sub: number; nickname: string }) {
    if (!Number.isSafeInteger(payload.sub) || payload.sub < 1)
      throw new UnauthorizedException();
    return {
      userId: payload.sub,
      nickname: payload.nickname,
    };
  }
}
