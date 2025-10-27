import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private generateOtp(length = 6) {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) code += digits[Math.floor(Math.random() * digits.length)];
    return code;
  }

  private async sendVerificationEmail(to: string, code: string) {
    const host = this.config.get<string>('mail.host');
    const port = Number(this.config.get<number>('mail.port') ?? 587);
    const user = this.config.get<string>('mail.user');
    const pass = this.config.get<string>('mail.pass');
    const from = this.config.get<string>('mail.from') || user || 'no-reply@example.com';

    if (!host || !user || !pass) {
      // Fallback: log to server for development
      console.warn('[MAILER] Missing SMTP config. OTP for', to, 'is', code);
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

  const appName = this.config.get<string>('mail.appName') || 'NhaCong';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${appName} - Xác thực email</h2>
        <p>Mã xác thực của bạn là:</p>
        <p style="font-size: 20px; font-weight: bold;">${code}</p>
        <p>Mã có hiệu lực trong 10 phút. Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
      </div>
    `;

    await transporter.sendMail({
      from,
      to,
      subject: `${appName} - Mã xác thực email`,
      html,
    });
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersRepo.findOneBy({ email });
    if (!user || !user.passwordHash) return null;
    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return null;

    // Chặn đăng nhập nếu chưa xác thực email (áp dụng cho tài khoản mới)
    if (user.emailVerified === false) {
      throw new UnauthorizedException('Email chưa được xác thực');
    }

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

    const otp = this.generateOtp(6);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone ?? null,
      role: dto.role ?? 'customer',
      emailVerified: false,
      emailVerificationCode: otp,
      emailVerificationExpires: expires,
    } as any);

  const saved = (await this.usersRepo.save(user)) as unknown as User;
    // Gửi email OTP (không throw để tránh lộ config), log nếu thiếu cấu hình
    try {
      await this.sendVerificationEmail(saved.email!, otp);
    } catch (e) {
      console.error('[MAILER] sendVerificationEmail failed:', (e as any)?.message || e);
    }
    return { message: 'Đã gửi mã xác thực tới email. Vui lòng kiểm tra hộp thư và nhập OTP để hoàn tất đăng ký.' };
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

  async verifyEmail(email: string, code: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Tài khoản không tồn tại');

    if (user.emailVerified === true) {
      return { message: 'Email đã được xác thực trước đó' };
    }
    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      throw new BadRequestException('Không tìm thấy mã xác thực. Vui lòng đăng ký lại.');
    }
    const now = new Date();
    if (now > new Date(user.emailVerificationExpires)) {
      throw new BadRequestException('Mã xác thực đã hết hạn');
    }
    if (String(code).trim() !== String(user.emailVerificationCode).trim()) {
      throw new BadRequestException('Mã xác thực không đúng');
    }
    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;
    await this.usersRepo.save(user);
    return { message: 'Xác thực email thành công' };
  }

  async loginWithGoogle(idToken: string) {
    const clientIds = (this.config.get<string>('GOOGLE_CLIENT_ID') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!clientIds.length) {
      throw new BadRequestException('Missing GOOGLE_CLIENT_ID in environment');
    }

    const client = new OAuth2Client();
    let payload: any | null = null;
    let lastErr: any = null;
    // Try verify against any of the provided client IDs
    for (const aud of clientIds) {
      try {
        const ticket = await client.verifyIdToken({ idToken, audience: aud });
        payload = ticket.getPayload();
        if (payload) break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!payload) {
      throw new UnauthorizedException('Google token không hợp lệ');
    }

    const sub = payload.sub as string;
    const email = payload.email as string | undefined;
    const emailVerified = Boolean(payload.email_verified);
    const name = (payload.name as string) || email?.split('@')[0] || 'Google User';
    const picture = (payload.picture as string) || undefined;

    if (!email) {
      throw new BadRequestException('Không lấy được email từ Google');
    }

    let user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      const newUser = this.usersRepo.create({
        email,
        name,
        avatarUrl: picture,
        emailVerified: emailVerified, // Google đã xác thực email
        role: 'customer' as any,
        provider: 'google',
        providerId: sub,
      } as any) as any;
      const saved = await this.usersRepo.save(newUser as any);
      user = saved as any;
    } else {
      // Update provider info if missing and set avatar/name if empty
      let changed = false;
      if (!user.provider) { user.provider = 'google'; changed = true; }
      if (!user.providerId && sub) { user.providerId = sub; changed = true; }
      if (!user.avatarUrl && picture) { user.avatarUrl = picture; changed = true; }
      if (!user.name && name) { user.name = name; changed = true; }
      if (!user.emailVerified && emailVerified) { user.emailVerified = true; changed = true; }
      if (changed) await this.usersRepo.save(user);
    }

    // Issue our JWT
    return this.login({
      id: user.id,
      email: user.email,
      role: (user as any).role,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: (user as any).phone,
    });
  }

  async loginWithGoogleCode(code: string, redirectUri: string) {
    const clientIdRaw = this.config.get<string>('GOOGLE_CLIENT_ID') || '';
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET') || '';
    if (!clientIdRaw || !clientSecret) {
      throw new BadRequestException('Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
    }
    // Optional: Validate redirectUri if a whitelist is defined
    const allowed = (this.config.get<string>('GOOGLE_REDIRECT_URIS') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowed.length && !allowed.includes(redirectUri)) {
      throw new BadRequestException('redirectUri is not allowed');
    }

    // Use the first clientId for OAuth2Client (supports multiple via id_token route above)
    const clientId = clientIdRaw.split(',').map((s) => s.trim()).filter(Boolean)[0];
    const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

    // Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken({ code, redirect_uri: redirectUri });
    if (!tokens || (!tokens.id_token && !tokens.access_token)) {
      throw new UnauthorizedException('Không đổi được token từ Google');
    }

    // Prefer verifying id_token if present
    if (tokens.id_token) {
      return this.loginWithGoogle(tokens.id_token);
    }

    // If only access_token is available, use tokeninfo endpoint as fallback
    const userinfoClient = new OAuth2Client();
    const ticket = await userinfoClient.verifyIdToken({ idToken: String(tokens.access_token), audience: clientId }).catch(() => null as any);
    if (ticket && ticket.getPayload()) {
      const payload = ticket.getPayload();
      // This path is unlikely since access_token isn't id_token; kept for completeness.
      const fakeIdJwt = String(tokens.access_token);
      return this.loginWithGoogle(fakeIdJwt);
    }

    // As a robust approach, fetch userinfo with access_token
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    } as any);
    if (!res.ok) {
      throw new UnauthorizedException('Không lấy được thông tin người dùng từ Google');
    }
    const info = await res.json();
    const email = info?.email as string | undefined;
    if (!email) throw new BadRequestException('Không lấy được email từ Google');
    const sub = info?.sub as string | undefined;
    const name = (info?.name as string) || email.split('@')[0];
    const picture = info?.picture as string | undefined;

    // Upsert user
    let user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      const newUser = this.usersRepo.create({
        email,
        name,
        avatarUrl: picture,
        emailVerified: true,
        role: 'customer' as any,
        provider: 'google',
        providerId: sub ?? null,
      } as any) as any;
      const saved = await this.usersRepo.save(newUser as any);
      user = saved as any;
    } else {
      let changed = false;
      if (!user.provider) { user.provider = 'google'; changed = true; }
      if (!user.providerId && sub) { user.providerId = sub; changed = true; }
      if (!user.avatarUrl && picture) { user.avatarUrl = picture; changed = true; }
      if (!user.name && name) { user.name = name; changed = true; }
      if (!user.emailVerified) { user.emailVerified = true; changed = true; }
      if (changed) await this.usersRepo.save(user);
    }

    return this.login({
      id: user.id,
      email: user.email,
      role: (user as any).role,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: (user as any).phone,
    });
  }

  async completeProfile(userId: number, dto: CompleteProfileDto) {
    if (!userId) throw new BadRequestException('Thiếu thông tin người dùng');
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Tài khoản không tồn tại');

    if (typeof dto.name !== 'undefined') user.name = dto.name?.trim() || null as any;
    if (typeof dto.phone !== 'undefined') user.phone = dto.phone?.trim() || null as any;
    if (dto.password_hash) {
      user.passwordHash = await bcrypt.hash(dto.password_hash, 10);
    }
    if (typeof dto.gender !== 'undefined') {
      // Ensure proper enum mapping
      user.gender = (dto.gender as any) ?? null;
    }
    if (typeof dto.dateOfBirth !== 'undefined') {
      const d = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
      user.dateOfBirth = d as any;
    }
    if (typeof dto.avatarUrl !== 'undefined') {
      user.avatarUrl = dto.avatarUrl?.trim() || null as any;
    }
    if (typeof dto.address !== 'undefined') {
      user.address = dto.address?.trim() || null as any;
    }
    await this.usersRepo.save(user);
    const { passwordHash, ...safe } = user as any;
    return { message: 'Cập nhật hồ sơ thành công', user: safe };
  }
}