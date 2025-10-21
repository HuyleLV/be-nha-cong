import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

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

  async login(user: { id?: number; email?: string; role?: string; name?: string; avatarUrl?: string; phone?: number }) {
    // Kiểm tra đầu vào
    if (!user || !user.id || !user.email || !user.role) {
      return {
        message: 'Tài khoản hoặc mật khẩu không đúng',
      };
    }
  
    const name = user.name ?? user.email?.split('@')[0] ?? 'User';
    const payload = { sub: user.id, email: user.email, role: user.role, name, avatarUrl: user.avatarUrl, phone: user.phone };
  
    try {
      const token = this.jwtService.sign(payload);
      return {
        accessToken: token,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        user: { id: user.id, email: user.email, role: user.role, name, avatarUrl: user.avatarUrl, phone: user.phone },
        message: 'Đăng nhập thành công',
      };
    } catch (error) {
      return {
        message: 'Sai thông tin đăng nhập hoặc token không hợp lệ',
      };
    }
  }

  async register(dto: RegisterDto) {
    const existed = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existed) throw new BadRequestException('Email đã tồn tại trên hệ thống!');

    const passwordHash = dto.password_hash ? await bcrypt.hash(dto.password_hash, 10) : undefined;

    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone ?? null,
      role: dto.role ?? 'customer',
    } as any);

    return this.usersRepo.save(user);
  }
  
  async adminLogin(email: string, password: string) {
    const u = await this.usersRepo.findOneBy({ email });
    if (!u || !(await bcrypt.compare(password, u.passwordHash ?? '')))
      throw new BadRequestException('Tài khoản hoặc mật khẩu không đúng');
    if (u.role !== 'admin')
      throw new BadRequestException('Tài khoản này không có quyền admin');
  
    const { passwordHash, ...safe } = u as any;
    const name = safe.name ?? safe.username ?? safe.email?.split('@')[0] ?? 'Admin';
  
    return this.login({ id: safe.id, email: safe.email, role: safe.role, name });
  }
}