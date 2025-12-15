import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, CustomerStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import * as bcrypt from 'bcrypt';
import { Viewing } from '../viewings/entities/viewing.entity';
import { Apartment } from '../apartment/entities/apartment.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Deposit } from '../deposits/entities/deposit.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(Viewing) private readonly viewingRepo: Repository<Viewing>,
    @InjectRepository(Apartment) private readonly aptRepo: Repository<Apartment>,
  ) {}

  async findAll(query: PaginationQueryDto, requester?: any) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const q = (query as any)?.q as string | undefined;
    const customerStatus = (query as any)?.customerStatus as string | undefined;

    const hasContractOrDepositRaw = (query as any)?.hasContractOrDeposit;
    const hasContractOrDeposit = typeof hasContractOrDepositRaw !== 'undefined' && (hasContractOrDepositRaw === true || hasContractOrDepositRaw === 'true' || hasContractOrDepositRaw === '1' || hasContractOrDepositRaw === 1);

    // Admin: full list
    if (!requester || String(requester.role).toLowerCase() === 'admin') {
      // Admin: optionally filter by customerStatus and q
      const qb = this.repo.createQueryBuilder('u').orderBy('u.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
      // when filtering by related contracts/deposits, add joins and distinct to avoid duplicates
      if (hasContractOrDeposit) {
        qb.distinct(true);
        qb.leftJoin(Contract, 'c', 'c.customerId = u.id');
        qb.leftJoin(Deposit, 'd', 'd.customerId = u.id');
        qb.andWhere('(c.id IS NOT NULL OR d.id IS NOT NULL)');
      }
      if (customerStatus) qb.andWhere('u.customerStatus = :cs', { cs: customerStatus });
      if (q) {
        const kw = `%${String(q).toLowerCase()}%`;
        qb.andWhere('(LOWER(u.name) LIKE :kw OR LOWER(u.email) LIKE :kw OR LOWER(u.phone) LIKE :kw)', { kw });
      }
      const [items, total] = await qb.getManyAndCount();
      return { items, meta: { total, page, limit, pageCount: Math.ceil(total / limit) } };
    }

    // Host: only users created by this host (ownerId) OR users who booked host's apartments
    if (String(requester.role).toLowerCase() === 'host' || String(requester.role).toLowerCase() === 'owner') {
      const hostId = Number(requester.id);

      // Build query: left join viewings -> apartments to capture users who booked host's apartments
      const qb = this.repo.createQueryBuilder('u')
        .distinct(true)
        .leftJoin(Viewing, 'v', 'v.userId = u.id')
        .leftJoin(Apartment, 'a', 'a.id = v.apartmentId')
        // group ownership/booking conditions so subsequent AND filters apply correctly
        .where('(u.ownerId = :hid OR a.createdById = :hid)', { hid: hostId })
        .orderBy('u.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      // when host requests only customers with contract or deposit, ensure relation exists
      if (hasContractOrDeposit) {
        qb.leftJoin(Contract, 'c', 'c.customerId = u.id');
        qb.leftJoin(Deposit, 'd', 'd.customerId = u.id');
        qb.andWhere('(c.id IS NOT NULL OR d.id IS NOT NULL)');
      }

      if (q) {
        const kw = `%${String(q).toLowerCase()}%`;
        qb.andWhere('(LOWER(u.name) LIKE :kw OR LOWER(u.email) LIKE :kw OR LOWER(u.phone) LIKE :kw)', { kw });
      }
      if (customerStatus) {
        qb.andWhere('u.customerStatus = :cs', { cs: customerStatus });
      }

      const [items, total] = await qb.getManyAndCount();
      return { items, meta: { total, page, limit, pageCount: Math.ceil(total / limit) } };
    }

    // Other roles: forbidden
    throw new ForbiddenException('Bạn không có quyền xem danh sách người dùng');
  }

  async findOne(id: number, requester?: any) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    if (!requester || String(requester.role).toLowerCase() === 'admin') return user;

    if (String(requester.role).toLowerCase() === 'host' || String(requester.role).toLowerCase() === 'owner') {
      const hostId = Number(requester.id);
      // Allow if ownerId matches
      if (user.ownerId && Number(user.ownerId) === hostId) return user;

      // Or if this user has a viewing on any apartment created by host
      const qb = this.viewingRepo.createQueryBuilder('v')
        .leftJoin(Apartment, 'a', 'a.id = v.apartmentId')
        .where('v.userId = :uid', { uid: id })
        .andWhere('a.createdById = :hid', { hid: hostId })
        .take(1);
      const found = await qb.getOne();
      if (found) return user;

      throw new ForbiddenException('Bạn không có quyền xem người dùng này');
    }

    throw new ForbiddenException('Bạn không có quyền xem người dùng này');
  }

  async create(dto: CreateUserDto, requester?: any) {
    // Server-side uniqueness checks: return informative message instead of throwing
    if (dto.email) {
      const existing = await this.repo.findOne({ where: { email: dto.email } });
      if (existing) {
        return { message: 'Email đã tồn tại, vui lòng chọn email khác' };
      }
    }
    if (dto.phone) {
      const existingPhone = await this.repo.findOne({ where: { phone: dto.phone } });
      if (existingPhone) {
        return { message: 'Số điện thoại đã tồn tại, vui lòng sử dụng số khác' };
      }
    }

    const saltRounds = 10;
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, saltRounds)
      : undefined;

    const entity = this.repo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: dto.role,
      // If a host creates a customer, ensure ownerId is set to that host
      ownerId: requester && String(requester.role).toLowerCase() === 'host' ? Number(requester.id) : (dto as any).ownerId,
      // Default workflow status to NEW when creating a customer
      customerStatus: (dto as any).customerStatus ?? CustomerStatus.NEW,
      avatarUrl: (dto as any).avatar ?? (dto as any).avatarUrl ?? null,
      idCardFront: (dto as any).idCardFront ?? null,
      idCardBack: (dto as any).idCardBack ?? null,
      idCardNumber: (dto as any).idCardNumber ?? null,
      address: (dto as any).address ?? null,
        idIssueDate: (dto as any).idIssueDate ? new Date((dto as any).idIssueDate) : null,
        idIssuePlace: (dto as any).idIssuePlace ?? null,
      note: (dto as any).note ?? null,
      gender: (dto as any).gender ?? null,
      dateOfBirth: (dto as any).dateOfBirth ? new Date((dto as any).dateOfBirth) : null,
    });

    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateUserDto, requester?: any) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    // If admin, allow full update
    if (!requester || String(requester.role).toLowerCase() === 'admin') {
      // Hash mật khẩu mới nếu có
      let passwordHash = user.passwordHash;
      if (dto.password) {
        const saltRounds = 10;
        passwordHash = await bcrypt.hash(dto.password, saltRounds);
      }

      Object.assign(user, {
        name: dto.name ?? user.name,
        email: dto.email ?? user.email,
        phone: dto.phone ?? user.phone,
        passwordHash,
        role: dto.role ?? user.role,
        customerStatus: (dto as any).customerStatus ?? user.customerStatus,
        avatarUrl: (dto as any).avatar ?? (dto as any).avatarUrl ?? user.avatarUrl,
        idCardFront: (dto as any).idCardFront ?? user.idCardFront,
        idCardBack: (dto as any).idCardBack ?? user.idCardBack,
        idCardNumber: (dto as any).idCardNumber ?? user.idCardNumber,
        idIssueDate: (dto as any).idIssueDate ? new Date((dto as any).idIssueDate) : user.idIssueDate,
        idIssuePlace: (dto as any).idIssuePlace ?? user.idIssuePlace,
        address: (dto as any).address ?? user.address,
        note: (dto as any).note ?? user.note,
        gender: (dto as any).gender ?? user.gender,
        dateOfBirth: (dto as any).dateOfBirth ? new Date((dto as any).dateOfBirth) : user.dateOfBirth,
      });

      return this.repo.save(user);
    }

    // If host, only allow changing customerStatus for owned or booked users
    if (String(requester.role).toLowerCase() === 'host' || String(requester.role).toLowerCase() === 'owner') {
      const hostId = Number(requester.id);

      // Check ownership or booking relation (same as findOne)
      const isOwner = user.ownerId && Number(user.ownerId) === hostId;
      let bookedByHost = false;
      if (!isOwner) {
        const qb = this.viewingRepo.createQueryBuilder('v')
          .leftJoin(Apartment, 'a', 'a.id = v.apartmentId')
          .where('v.userId = :uid', { uid: id })
          .andWhere('a.createdById = :hid', { hid: hostId })
          .take(1);
        const found = await qb.getOne();
        bookedByHost = !!found;
      }

      if (!isOwner && !bookedByHost) {
        throw new ForbiddenException('Bạn không có quyền cập nhật người dùng này');
      }

      // Hosts may update customer fields (their customers or users who booked their apartments)
      // but must NOT be allowed to change password, role or ownerId.
      if ((dto as any).password) {
        throw new ForbiddenException('Hosts không được phép thay đổi mật khẩu');
      }
      if ((dto as any).role) {
        throw new ForbiddenException('Hosts không được phép thay đổi role');
      }
      if (typeof (dto as any).ownerId !== 'undefined' && Number((dto as any).ownerId) !== Number(user.ownerId)) {
        throw new ForbiddenException('Hosts không được phép thay đổi chủ sở hữu khách hàng');
      }
      // Hosts may update customer fields (their customers or users who booked their apartments)
      // but must NOT be allowed to change password, role or ownerId.
      // Allowed fields that a host can update on their customer
      const allowed = ['name', 'email', 'phone', 'note', 'avatar', 'avatarUrl', 'idCardFront', 'idCardBack', 'idCardNumber', 'address', 'customerStatus', 'idIssueDate', 'idIssuePlace', 'gender', 'dateOfBirth'];

      // If email is being changed, ensure uniqueness
      if ((dto as any).email && String((dto as any).email).toLowerCase() !== String(user.email).toLowerCase()) {
        const exist = await this.repo.findOne({ where: { email: (dto as any).email } });
        if (exist) throw new BadRequestException('Email đã tồn tại, vui lòng chọn email khác');
      }

      let changed = false;
      for (const k of allowed) {
        if (typeof (dto as any)[k] !== 'undefined') {
          if (k === 'dateOfBirth') {
            (user as any).dateOfBirth = (dto as any).dateOfBirth ? new Date((dto as any).dateOfBirth) : null;
          } else if (k === 'idIssueDate') {
            (user as any).idIssueDate = (dto as any).idIssueDate ? new Date((dto as any).idIssueDate) : null;
          } else if (k === 'avatar' || k === 'avatarUrl') {
            (user as any).avatarUrl = (dto as any).avatar ?? (dto as any).avatarUrl ?? (user as any).avatarUrl;
          } else {
            (user as any)[k] = (dto as any)[k];
          }
          changed = true;
        }
      }

      if (!changed) {
        throw new BadRequestException('Không có trường hợp nào để cập nhật');
      }

      return this.repo.save(user);
    }

    throw new ForbiddenException('Bạn không có quyền cập nhật người dùng này');
  }

  async remove(id: number, requester?: any) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    // Admin can delete any user
    if (!requester || String(requester.role).toLowerCase() === 'admin') {
      await this.repo.remove(user);
      return { deleted: true };
    }

    // Host can delete ONLY their own customers (ownerId matches host id)
    if (String(requester.role).toLowerCase() === 'host' || String(requester.role).toLowerCase() === 'owner') {
      const hostId = Number(requester.id);
      if (user.ownerId && Number(user.ownerId) === hostId) {
        await this.repo.remove(user);
        return { deleted: true };
      }
      throw new ForbiddenException('Bạn chỉ có thể xóa khách hàng do bạn tạo');
    }

    throw new ForbiddenException('Bạn không có quyền xóa người dùng này');
  }
}
