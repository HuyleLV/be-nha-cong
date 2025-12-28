import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(@InjectRepository(Report) private readonly repo: Repository<Report>) {}

  async create(dto: CreateReportDto, userId?: number) {
    const payload: any = { ...(dto as any), createdBy: userId ?? null, status: (dto as any).status ?? 'pending' };
    if (payload.reportedAt) {
      try { payload.reportedAt = new Date(payload.reportedAt); } catch (e) { payload.reportedAt = null; }
    }
    // for certain types (fire, complaint) amount should not be stored
    if (payload.type && ['fire', 'complaint'].includes(String(payload.type))) {
      payload.amount = null;
    }
    const ent = this.repo.create(payload);
    return this.repo.save(ent);
  }

  async findAll(q: QueryReportDto, user?: any) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo.createQueryBuilder('r').orderBy('r.id', 'DESC').take(limit).skip((page - 1) * limit);

    if (q.q) qb.andWhere('(r.title LIKE :kw OR r.description LIKE :kw)', { kw: `%${q.q}%` });
    if (q.buildingId) qb.andWhere('r.building_id = :bid', { bid: q.buildingId });
    if (q.apartmentId) qb.andWhere('r.apartment_id = :aid', { aid: q.apartmentId });
    if (q.status) qb.andWhere('r.status = :st', { st: q.status });
    if ((q as any).type) qb.andWhere('r.type = :tp', { tp: (q as any).type });

    qb.leftJoinAndMapOne('r.customer', User, 'customer', 'customer.id = r.customer_id');

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
    if (!it) throw new NotFoundException('Report not found');
    return it;
  }

  async update(id: number, dto: UpdateReportDto, userId?: number, userRole?: string) {
    const it = await this.repo.findOne({ where: { id } });
    if (!it) throw new NotFoundException('Report not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(it.createdBy) !== String(userId)) throw new NotFoundException('Không có quyền sửa báo cáo này');
    }
    const payload: any = { ...(dto as any) };
    if (payload.reportedAt) {
      try { payload.reportedAt = new Date(payload.reportedAt); } catch (e) { payload.reportedAt = null; }
    }
    // if client sets type to fire/complaint (or updating to such type), clear amount
    if (payload.type && ['fire', 'complaint'].includes(String(payload.type))) {
      payload.amount = null;
    }
    Object.assign(it as any, payload);
    return this.repo.save(it);
  }

  async remove(id: number, userId?: number, userRole?: string) {
    const it = await this.repo.findOne({ where: { id } });
    if (!it) throw new NotFoundException('Report not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(it.createdBy) !== String(userId)) throw new NotFoundException('Không có quyền xóa báo cáo này');
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
