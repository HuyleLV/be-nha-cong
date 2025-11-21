import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bed } from './entities/bed.entity';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { QueryBedDto } from './dto/query-bed.dto';

@Injectable()
export class BedService {
  constructor(
    @InjectRepository(Bed) private readonly repo: Repository<Bed>,
  ) {}

  async create(dto: CreateBedDto, userId?: number) {
  const ent = this.repo.create({ ...(dto as any), createdById: userId ?? null });
    return this.repo.save(ent);
  }

  async findAll(q: QueryBedDto, user?: any) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo.createQueryBuilder('b').orderBy('b.id', 'DESC').take(limit).skip((page - 1) * limit);
    if (q.q) qb.andWhere('(b.name ILIKE :kw)', { kw: `%${q.q}%` });
    if (q.status) qb.andWhere('b.status = :st', { st: q.status });

    // If caller is host restrict to their own beds
    if (user && (user.role === 'host' || user.role === 'Host')) {
      const uid = user.id ?? user.sub ?? null;
      if (uid) qb.andWhere('b.created_by = :uid', { uid });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit, pageCount: Math.ceil(total / limit) } };
  }

  async findOne(id: number, user?: any) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Bed not found');
    if (user && (user.role === 'host' || user.role === 'Host')) {
      const uid = user.id ?? user.sub ?? null;
      if (uid && String(b.createdById) !== String(uid)) throw new ForbiddenException('Không có quyền xem tài nguyên này');
    }
    return b;
  }

  async update(id: number, dto: UpdateBedDto, userId?: number, userRole?: string) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Bed not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(b.createdById) !== String(userId)) throw new ForbiddenException('Không có quyền sửa tài nguyên này');
    }
  Object.assign(b, dto as any);
    return this.repo.save(b);
  }

  async remove(id: number, userId?: number, userRole?: string) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Bed not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(b.createdById) !== String(userId)) throw new ForbiddenException('Không có quyền xóa tài nguyên này');
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
