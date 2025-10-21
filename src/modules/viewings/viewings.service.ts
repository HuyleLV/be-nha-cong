// src/viewings/viewings.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { Viewing } from './entities/viewing.entity';
import { CreateViewingDto } from './dto/create-viewing.dto';
import { UpdateViewingStatusDto } from './dto/update-viewing-status.dto';
import { QueryViewingDto } from './dto/query-viewing.dto';
import { Apartment } from '../apartment/entities/apartment.entity';

@Injectable()
export class ViewingsService {
  constructor(
    @InjectRepository(Viewing) private readonly repo: Repository<Viewing>,
    @InjectRepository(Apartment) private readonly aptRepo: Repository<Apartment>,
  ) {}

  private async assertApartment(apartmentId: number) {
    const apt = await this.aptRepo.findOne({ where: { id: apartmentId }});
    if (!apt) throw new BadRequestException('Apartment không tồn tại');
    if ((apt as any).status && (apt as any).status !== 'published') {
      // tuỳ policy: có cho đặt xem phòng với bài nháp không
    }
    return apt;
  }

  /** Optional: kiểm tra trùng slot đơn giản (±90 phút) */
  private async assertNoConflict(apartmentId: number, preferredAt: Date) {
    const start = new Date(preferredAt.getTime() - 90 * 60 * 1000);
    const end   = new Date(preferredAt.getTime() + 90 * 60 * 1000);
    const conflict = await this.repo.findOne({
      where: {
        apartmentId,
        preferredAt: In([]) as any, // hack TS
      } as any,
    });
    // QueryBuilder chính xác hơn:
    const qb = this.repo.createQueryBuilder('v')
      .where('v.apartmentId = :aid', { aid: apartmentId })
      .andWhere('v.status IN (:...st)', { st: ['pending','confirmed'] })
      .andWhere('v.preferredAt BETWEEN :st AND :ed', { st: start, ed: end })
      .take(1);

    const found = await qb.getOne();
    if (found) throw new BadRequestException('Khung giờ đã có người đặt, vui lòng chọn giờ khác');
  }

  async create(dto: CreateViewingDto, userId?: number) {
    const apt = await this.assertApartment(dto.apartmentId);

    const preferredAt = new Date(dto.preferredAt);
    if (isNaN(preferredAt.getTime())) {
      throw new BadRequestException('preferredAt không hợp lệ');
    }

    const name  = dto.name || (userId ? 'Người dùng' : 'Khách');
    const email = dto.email || null;
    const phone = dto.phone || null;

    const entity = this.repo.create({
      apartmentId: apt.id,
      userId: userId ?? null,
      name, email, phone,
      preferredAt,
      note: dto.note ?? null,
      status: 'pending',
      processedById: null,
      staffNote: null,
    });
    const saved = await this.repo.save(entity);
    return { message: 'Đã tạo yêu cầu xem phòng', data: saved };
  }

  /** Người dùng xem các yêu cầu của họ */
  async findMine(userId: number, q: QueryViewingDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 12;

    const [items, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: { total, page, limit, pageCount: Math.ceil(total / limit) },
    };
  }

  /** Admin list + filter */
  async adminFindAll(q: QueryViewingDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const qb = this.repo.createQueryBuilder('v')
      .orderBy('v.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (q.apartmentId) qb.andWhere('v.apartmentId = :aid', { aid: q.apartmentId });
    if (q.status) qb.andWhere('v.status = :st', { st: q.status });
    if (q.q) {
      qb.andWhere('(v.name ILIKE :kw OR v.email ILIKE :kw OR v.phone ILIKE :kw)', {
        kw: `%${q.q}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      meta: { total, page, limit, pageCount: Math.ceil(total / limit) },
    };
  }

  async adminUpdateStatus(id: number, dto: UpdateViewingStatusDto, adminId: number) {
    const v = await this.repo.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Yêu cầu xem phòng không tồn tại');

    v.status = dto.status;
    v.staffNote = dto.staffNote ?? v.staffNote;
    v.processedById = adminId;

    await this.repo.save(v);
    return { message: 'Đã cập nhật trạng thái', data: v };
  }

  async adminRemove(id: number) {
    const ok = await this.repo.findOne({ where: { id } });
    if (!ok) throw new NotFoundException('Yêu cầu xem phòng không tồn tại');
    await this.repo.delete(id);
    return { success: true };
  }
}
