// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change_me',
    });
  }

  // Validate will be called by passport after verifying token signature.
  // We load the user from DB to return a richer user object (including phoneVerified)
  // but we intentionally omit sensitive fields like passwordHash.
  async validate(payload: any) {
    const id = payload.sub ?? payload.id ?? null;
    if (!id) return { id: null } as any;

    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) return { id } as any;

    // Remove sensitive/internal-only properties
    const { passwordHash, emailVerificationCode, phoneVerificationCode, emailVerificationExpires, phoneVerificationExpires, ...safe } = user as any;
    return safe;
  }
}
