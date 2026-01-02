// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { ZaloModule } from '../zalo/zalo.module';

@Module({
  imports: [
    ConfigModule, // cần để lấy env trong useFactory
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ZaloModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const secret = cfg.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is missing. Please set it in your .env');
        }
        return {
          secret,
          signOptions: {
            // Extend default token lifetime to 24 hours unless overridden in env
            expiresIn: cfg.get<string>('JWT_EXPIRES_IN') ?? '24h',
          },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule], // export JwtModule nếu nơi khác cần JwtService
})
export class AuthModule {}