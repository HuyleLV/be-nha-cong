import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly usersRepo: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    async validateUser(email: string, password: string) {
        const user = await this.usersRepo.findOneBy({ email });
        if (!user || !user.passwordHash) return null;
        const matched = await bcrypt.compare(password, user.passwordHash);
        if (!matched) return null;

        const { passwordHash, ...safe } = user as any;
        
        return safe;
    }

    async login(user: { id: number; email: string; role: string; name?: string }) {
        const name = user.name ?? user.email?.split('@')[0] ?? 'User';
        const payload = { sub: user.id, email: user.email, role: user.role, name };
        return {
          accessToken: this.jwtService.sign(payload),
          expiresIn: process.env.JWT_EXPIRES_IN || '1h',
          user: { id: user.id, email: user.email, role: user.role, name }, // trả kèm info
        };
      }
      
      async adminLogin(email: string, password: string) {
        const u = await this.usersRepo.findOneBy({ email });
        if (!u || !(await bcrypt.compare(password, u.passwordHash ?? '')))
          throw new BadRequestException('Tài khoản hoặc mật khẩu không đúng');
        if (u.role !== 'admin')
          throw new BadRequestException('Tài khoản này không có quyền admin');
      
        const { passwordHash, ...safe } = u as any;
        const name = safe.name ?? safe.username ?? safe.email?.split('@')[0] ?? 'Admin';
      
        // nhét thông tin user xuống FE
        return this.login({ id: safe.id, email: safe.email, role: safe.role, name });
      }
      
}