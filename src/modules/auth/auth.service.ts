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
import { ZaloService } from '../zalo/zalo.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly zalo: ZaloService,
  ) {}

  private generateOtp(length = 6) {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) code += digits[Math.floor(Math.random() * digits.length)];
    return code;
  }

  private normalizePhone(phone: string) {
    const raw = String(phone || '').trim();
    // Simple VN-friendly normalization: remove spaces and dashes; keep leading +84 or 0
    const compact = raw.replace(/\s|-/g, '');
    return compact;
  }

  private async sendPhoneOtpViaZalo(phone: string, code: string) {
    const templateId = this.config.get<string>('ZNS_TEMPLATE_ID_OTP');
    const trackingId = `otp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    if (!templateId) {
      console.warn('[ZALO] Missing ZNS_TEMPLATE_ID_OTP in env; skip sending OTP');
      console.info('[ZALO][SKIP]', { phone, code, trackingId });
      return { sent: false } as any;
    }
    try {
      const result = await this.zalo.sendTemplateHashphone({
        phone,
        templateId,
        templateData: { otp: code },
        trackingId,
      });
      if (result?.sent) {
        console.info('[ZALO][SENT]', { phone, trackingId });
      } else {
        console.warn('[ZALO][NOT_SENT]', { phone, code, trackingId, status: result?.status });
      }
      return result;
    } catch (e) {
      console.error('[ZALO][ERROR] sendPhoneOtpViaZalo', { phone, code, trackingId, error: (e as any)?.message || e });
      return { sent: false } as any;
    }
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

  async validateUser(identifier: string, password: string) {
    // Allow login by email or phone
    const isEmail = /@/.test(String(identifier || ''));
    const where = isEmail ? { email: identifier } : { phone: String(identifier).trim() } as any;
    const user = await this.usersRepo.findOne({ where });
    if (!user || !user.passwordHash) return null;
    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return null;

    // Previously we required either email or phone verification before login.
    // Removed that requirement so users who register with email/password can login immediately.

    const { passwordHash, ...safe } = user as any;
    
    return safe;
  }

  async login(user: { id?: number; email?: string | null; role?: string; name?: string | null; avatarUrl?: string | null; phone?: string | number | null }) {
    // Kiểm tra đầu vào
    if (!user || !user.id || !user.role) {
      return {
        message: 'Tài khoản hoặc mật khẩu không đúng',
      };
    }
    
    const derivedName = user.name ?? (user.email ? user.email.split('@')[0] : undefined) ?? `User${user.id}`;
    const payload: any = { sub: user.id, role: user.role, name: derivedName };
    if (user.email) payload.email = user.email;
    if (user.avatarUrl) payload.avatarUrl = user.avatarUrl;
    if (user.phone) payload.phone = user.phone;
  
    try {
      const token = this.jwtService.sign(payload);
      return {
        accessToken: token,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        user: { id: user.id, email: user.email ?? null, role: user.role, name: derivedName, avatarUrl: user.avatarUrl ?? null, phone: user.phone ?? null },
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
    // Create user and mark emailVerified true so that email verification step is skipped.
    const passwordHash = dto.password_hash ? await bcrypt.hash(dto.password_hash, 10) : undefined;
    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      phone: dto.phone ?? null,
      role: dto.role ?? 'customer',
      emailVerified: true, // skip email verification
      emailVerificationCode: null,
      emailVerificationExpires: null,
    } as any);

    const saved = (await this.usersRepo.save(user)) as unknown as User;

    // If the user provided a password, auto-login and return token so frontend can log in immediately.
    if (saved.passwordHash) {
      return this.login({ id: saved.id, role: (saved as any).role, name: saved.name ?? null, email: saved.email ?? null, phone: saved.phone ?? null, avatarUrl: saved.avatarUrl ?? null });
    }

    return { message: 'Đăng ký thành công' };
  }
  
  async adminLogin(identifier: string, password: string) {
    const isEmail = /@/.test(String(identifier || ''));
    const where = isEmail ? { email: identifier } : { phone: String(identifier).trim() } as any;
    const u = await this.usersRepo.findOne({ where });
    if (!u || !(await bcrypt.compare(password, u.passwordHash ?? '')))
      throw new BadRequestException('Tài khoản hoặc mật khẩu không đúng');
    if (u.role !== 'admin')
      throw new BadRequestException('Tài khoản này không có quyền admin');
  
    const { passwordHash, ...safe } = u as any;
    const name = safe.name ?? safe.username ?? safe.email?.split('@')[0] ?? 'Admin';
  
    return this.login({ id: safe.id, email: safe.email, role: safe.role, name, phone: (safe as any).phone });
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

  // Khởi tạo/ gửi OTP đến số điện thoại để đăng ký/xác minh
  async startRegisterByPhone(phoneRaw: string) {
    const phone = this.normalizePhone(phoneRaw);
    if (!phone) throw new BadRequestException('Số điện thoại không hợp lệ');

    let user = await this.usersRepo.findOne({ where: { phone } });
    // If a user with this phone already exists and has a password (fully registered), don't throw 400.
    // Instead return a friendly message so frontend can guide the user to login.
    if (user && user.passwordHash) {
      return { message: 'Số điện thoại này đã được đăng ký', alreadyRegistered: true } as any;
    }
    const otp = this.generateOtp(6);
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    if (!user) {
      // Tạo tài khoản tối thiểu với role customer
      user = this.usersRepo.create({
        phone,
        role: 'customer' as any,
        emailVerified: false,
        phoneVerified: false,
        phoneVerificationCode: otp,
        phoneVerificationExpires: expires,
      } as any) as any;
    } else {
      user.phoneVerificationCode = otp;
      user.phoneVerificationExpires = expires;
      // Không reset emailVerified/phoneVerified ở đây
    }

    await this.usersRepo.save(user);
    await this.sendPhoneOtpViaZalo(phone, otp);
    return { message: 'Đã gửi mã xác thực qua Zalo/SMS. Vui lòng kiểm tra tin nhắn.', expiresAt: expires };
  }

  // Xác minh OTP điện thoại, sau đó đăng nhập
  async verifyPhone(phoneRaw: string, code: string) {
    const phone = this.normalizePhone(phoneRaw);
    if (!phone || !code) throw new BadRequestException('Thiếu thông tin xác minh');

    let user = await this.usersRepo.findOne({ where: { phone } });
    if (!user) {
      // Cho phép tạo nhanh nếu chưa tồn tại, coi như đã xác minh (trường hợp user đến thẳng verify với đúng OTP do hệ thống gửi trước)
      user = this.usersRepo.create({
        phone,
        role: 'customer' as any,
        phoneVerified: true,
        emailVerified: false,
        phoneVerificationCode: null,
        phoneVerificationExpires: null,
      } as any) as any;
      const saved = await this.usersRepo.save(user);
      return this.login({ id: saved.id, role: (saved as any).role, name: saved.name ?? null, email: saved.email ?? null, phone: saved.phone ?? null, avatarUrl: saved.avatarUrl ?? null });
    }

    if (!user.phoneVerificationCode || !user.phoneVerificationExpires) {
      throw new BadRequestException('Không tìm thấy mã xác thực. Vui lòng yêu cầu lại mã.');
    }
    const now = new Date();
    if (now > new Date(user.phoneVerificationExpires)) {
      throw new BadRequestException('Mã xác thực đã hết hạn');
    }
    if (String(code).trim() !== String(user.phoneVerificationCode).trim()) {
      throw new BadRequestException('Mã xác thực không đúng');
    }

    user.phoneVerified = true as any;
    user.phoneVerificationCode = null;
    user.phoneVerificationExpires = null;
    await this.usersRepo.save(user);

    return this.login({ id: user.id, role: (user as any).role, name: user.name ?? null, email: user.email ?? null, phone: user.phone ?? null, avatarUrl: user.avatarUrl ?? null });
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