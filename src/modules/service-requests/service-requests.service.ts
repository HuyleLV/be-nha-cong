import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { User } from '../users/entities/user.entity';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { QueryServiceRequestDto } from './dto/query-service-request.dto';

@Injectable()
export class ServiceRequestsService {
  constructor(@InjectRepository(ServiceRequest) private readonly repo: Repository<ServiceRequest>) {}

  async create(dto: CreateServiceRequestDto, userId?: number) {
    // Normalize requestedAt (accept ISO string from DTO)
    const payload: any = { ...(dto as any), createdBy: userId ?? null, status: (dto as any).status ?? 'pending' };
    if (payload.requestedAt) {
      try { payload.requestedAt = new Date(payload.requestedAt); } catch (e) { payload.requestedAt = null; }
    }
    const ent = this.repo.create(payload);
    return this.repo.save(ent);
  }

  async findAll(q: QueryServiceRequestDto, user?: any) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo.createQueryBuilder('r').orderBy('r.id', 'DESC').take(limit).skip((page - 1) * limit);

    if (q.q) qb.andWhere('(r.title LIKE :kw OR r.description LIKE :kw)', { kw: `%${q.q}%` });
    if (q.buildingId) qb.andWhere('r.building_id = :bid', { bid: q.buildingId });
    if (q.apartmentId) qb.andWhere('r.apartment_id = :aid', { aid: q.apartmentId });
    if (q.status) qb.andWhere('r.status = :st', { st: q.status });

  // join customer info for convenience (name, phone)
  qb.leftJoinAndMapOne('r.customer', User, 'customer', 'customer.id = r.customer_id');

    // If user is host, restrict to their own created items
    if (user && (user.role === 'host' || user.role === 'Host')) {
      const uid = user.id ?? user.sub ?? null;
      if (uid) qb.andWhere('r.created_by = :uid', { uid });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit, pageCount: Math.ceil(total / limit) } };
  }

  async findOne(id: number, user?: any) {
    const qb = this.repo.createQueryBuilder('r').where('r.id = :id', { id });
    qb.leftJoinAndMapOne('r.customer', User, 'customer', 'customer.id = r.customer_id');
    const it = await qb.getOne();
    if (!it) throw new NotFoundException('Service Request not found');
    return it;
  }

  async update(id: number, dto: UpdateServiceRequestDto, userId?: number, userRole?: string) {
    const it = await this.repo.findOne({ where: { id } });
    if (!it) throw new NotFoundException('Service Request not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(it.createdBy) !== String(userId)) throw new NotFoundException('Không có quyền sửa yêu cầu này');
    }
    const payload: any = { ...(dto as any) };
    if (payload.requestedAt) {
      try { payload.requestedAt = new Date(payload.requestedAt); } catch (e) { payload.requestedAt = null; }
    }
    Object.assign(it as any, payload);
    return this.repo.save(it);
  }

  async remove(id: number, userId?: number, userRole?: string) {
    const it = await this.repo.findOne({ where: { id } });
    if (!it) throw new NotFoundException('Service Request not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(it.createdBy) !== String(userId)) throw new NotFoundException('Không có quyền xóa yêu cầu này');
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
