// src/partners/partners.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Partners } from './entities/partners.entity';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { User, UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

type Role = 'landlord' | 'customer' | 'operator';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partners)
    private readonly repo: Repository<Partners>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreatePartnerDto) {
    const lead = this.repo.create({ ...dto });
    return this.repo.save(lead);
  }

  async findAll(query?: {
    page?: number;
    limit?: number;
    role?: Role;
    status?: 'pending' | 'approved' | 'cancelled';
    q?: string; // search by name/email/phone
  }) {
    const page = Math.max(1, Number(query?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query?.limit || 20)));
    const skip = (page - 1) * limit;

    // Nếu không có q -> dùng findAndCount nhanh
    if (!query?.q) {
      const where: FindOptionsWhere<Partners>[] = [];
      if (query?.role) where.push({ role: query.role });
      if (query?.status) where.push({ status: query.status as any });

      const [items, total] = await this.repo.findAndCount({
        where: where.length ? where : undefined,
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      return { items, total, page, limit };
    }

    // Có q -> dùng queryBuilder cho search
    const qb = this.repo.createQueryBuilder('pl').orderBy('pl.createdAt', 'DESC');

    if (query?.role) {
      qb.andWhere('pl.role = :role', { role: query.role });
    }
    if (query?.status) {
      qb.andWhere('pl.status = :status', { status: query.status });
    }

    const kw = `%${query.q}%`;

    // Postgres: ILIKE; các DB khác fallback LIKE
    const driver = this.repo.manager.connection.options.type;
    const likeOp = driver === 'postgres' ? 'ILIKE' : 'LIKE';

    qb.andWhere(
      `(pl.fullName ${likeOp} :kw OR pl.email ${likeOp} :kw OR pl.phone ${likeOp} :kw)`,
      { kw },
    );

    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async findOneOrFail(id: number) {
    const found = await this.findOne(id);
    if (!found) throw new NotFoundException('Partner not found');
    return found;
  }

  // (Tuỳ chọn) Update cho PUT /partners/:id nếu cần
  async update(id: number, dto: Partial<CreatePartnerDto>) {
    const entity = await this.findOneOrFail(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: number) {
    const entity = await this.findOneOrFail(id);
    await this.repo.remove(entity);
  }

  private generatePassword(length = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%';
    let out = '';
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  private async sendApprovalEmail(to: string, name: string, email: string, password?: string) {
    const host = this.config.get<string>('mail.host');
    const port = Number(this.config.get<number>('mail.port') ?? 587);
    const user = this.config.get<string>('mail.user');
    const pass = this.config.get<string>('mail.pass');
    const from = this.config.get<string>('mail.from') || user || 'no-reply@example.com';
    const appName = this.config.get<string>('mail.appName') || 'NhaCong';

    if (!host || !user || !pass) {
      console.warn('[MAILER] Missing SMTP config. APPROVAL for', to, 'email:', email, 'pw:', password);
      return;
    }

    // Gmail app passwords đôi khi được copy có khoảng trắng; loại bỏ khoảng trắng để tránh lỗi auth
    const sanitizedPass = pass.replace(/\s+/g, '');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: sanitizedPass },
    });

    const html = password ? `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${appName} - Phê duyệt đối tác (Chủ nhà)</h2>
        <p>Xin chào ${name || email},</p>
        <p>Yêu cầu hợp tác của bạn đã được phê duyệt. Quyền Chủ nhà đã được kích hoạt.</p>
        <p>Thông tin đăng nhập (mật khẩu đã được đặt lại nếu bạn từng có tài khoản trước đó):</p>
        <ul>
          <li>Email: <b>${email}</b></li>
          <li>Mật khẩu tạm: <b>${password}</b></li>
        </ul>
        <p>Vui lòng đăng nhập và đổi mật khẩu ngay để bảo mật tài khoản.</p>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${appName} - Quyền Chủ nhà đã được kích hoạt</h2>
        <p>Xin chào ${name || email},</p>
        <p>Yêu cầu hợp tác của bạn đã được phê duyệt. Tài khoản hiện đã có quyền Chủ nhà.</p>
        <p>Bạn có thể đăng nhập bằng mật khẩu đã thiết lập trước đó. Nếu quên mật khẩu, vui lòng dùng chức năng quên mật khẩu.</p>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject: `${appName} - ${password ? 'Tài khoản Chủ nhà đã sẵn sàng' : 'Quyền Chủ nhà đã kích hoạt'}`,
        html,
      });
      console.log('[MAILER][APPROVAL] sent', { to, id: info.messageId });
    } catch (e:any) {
      console.error('[MAILER][APPROVAL][ERROR]', e?.message || e);
    }
  }

  async approve(id: number) {
    const lead = await this.findOneOrFail(id);
    if (lead.status === 'approved') return { message: 'Lead đã được phê duyệt trước đó' } as any;

    // Only auto-create account for landlord role
    if (lead.role === 'landlord') {
      // Check existing user by email
      let user: User | null = lead.email ? await this.usersRepo.findOne({ where: { email: lead.email } }) : null;
      if (!user) {
        if (!lead.email) {
          throw new BadRequestException('Lead không có email, không thể tạo tài khoản');
        }
        const rawPassword = this.generatePassword(10);
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        user = this.usersRepo.create({
          name: lead.fullName as any,
          email: lead.email as any,
          phone: (lead as any).phone || null,
          passwordHash: passwordHash as any,
          role: 'host' as unknown as UserRole,
        } as unknown as Partial<User>);
        user = await this.usersRepo.save(user);
        // Send credentials via email (tài khoản mới)
        await this.sendApprovalEmail(lead.email, lead.fullName, lead.email, rawPassword);
      } else {
        // Luôn reset mật khẩu & gửi lại thông tin đăng nhập khi phê duyệt
        const rawPassword = this.generatePassword(10);
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        let needSave = false;
        if ((user as any).role !== 'host') {
          (user as any).role = 'host' as any;
          needSave = true;
        }
        (user as any).passwordHash = passwordHash as any;
        needSave = true;
        if (needSave) {
          await this.usersRepo.save(user);
        }
        if (lead.email) {
          await this.sendApprovalEmail(lead.email, lead.fullName, lead.email, rawPassword);
        }
      }
    }

    lead.status = 'approved' as any;
    await this.repo.save(lead);
    return { message: 'Đã phê duyệt lead' } as any;
  }

  async cancel(id: number) {
    const lead = await this.findOneOrFail(id);
    if (lead.status === 'cancelled') return { message: 'Lead đã bị huỷ trước đó' } as any;
    lead.status = 'cancelled' as any;
    await this.repo.save(lead);
    return { message: 'Đã huỷ lead' } as any;
  }
}