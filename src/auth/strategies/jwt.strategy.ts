import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey', // Fallback for dev only
    });
  }

  async validate(payload: any) {
    // Ideally we should check if user exists in DB and fetch fresh roles here.
    // However, if we put roles in JWT payload at login, we can just use that.
    // For now, let's keep it simple and just return what's in the payload if we can, 
    // OR fetch the user again. Fetching is safer.
    // But JwtStrategy doesn't have PrismaService injected yet.
    // Let's assume we put roles in payload for performance in this specific step, 
    // or better: Inject PrismaService here.
    return { userId: payload.sub, email: payload.email, roles: payload.roles }; 
  }
}
