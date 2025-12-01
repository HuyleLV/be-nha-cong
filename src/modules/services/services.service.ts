import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';

@Injectable()
export class ServicesService {
  constructor(@InjectRepository(Service) private readonly repo: Repository<Service>) {}

  async create(dto: CreateServiceDto, userId?: number) {
    const ent = this.repo.create({ ...(dto as any), createdById: userId ?? null });
    return this.repo.save(ent);
  }

  async findAll(q: QueryServiceDto, user?: any) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo.createQueryBuilder('s').orderBy('s.id', 'DESC').take(limit).skip((page - 1) * limit);
    if (q.q) qb.andWhere('(s.name ILIKE :kw)', { kw: `%${q.q}%` });
    if (q.buildingId) qb.andWhere('s.building_id = :bid', { bid: q.buildingId });
    if (user && (user.role === 'host' || user.role === 'Host')) {
      const uid = user.id ?? user.sub ?? null;
      if (uid) {
        if (q.buildingId) {
          // join buildings table to ensure ownership of the building
          qb.leftJoin('buildings', 'b', 'b.id = s.building_id');
          qb.andWhere('b.created_by = :uid', { uid });
        } else {
          qb.andWhere('s.created_by = :uid', { uid });
        }
      }
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit, pageCount: Math.ceil(total / limit) } };
  }

  async findOne(id: number, user?: any) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Service not found');
    if (user && (user.role === 'host' || user.role === 'Host')) {
      const uid = user.id ?? user.sub ?? null;
      if (uid && String(s.createdById) !== String(uid)) throw new ForbiddenException('Không có quyền xem dịch vụ này');
    }
    return s;
  }

  async update(id: number, dto: UpdateServiceDto, userId?: number, userRole?: string) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Service not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(s.createdById) !== String(userId)) throw new ForbiddenException('Không có quyền sửa dịch vụ này');
    }
    Object.assign(s, dto as any);
    return this.repo.save(s);
  }

  async remove(id: number, userId?: number, userRole?: string) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Service not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(s.createdById) !== String(userId)) throw new ForbiddenException('Không có quyền xóa dịch vụ này');
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
