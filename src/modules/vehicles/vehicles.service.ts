import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private readonly repo: Repository<Vehicle>) {}

  async create(dto: CreateVehicleDto, userId?: number) {
    const ent = this.repo.create({ ...(dto as any), createdBy: userId ?? null });
    return this.repo.save(ent);
  }

  async findAll(q: QueryVehicleDto, user?: any) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo.createQueryBuilder('v').orderBy('v.id', 'DESC').take(limit).skip((page - 1) * limit);
    if (q.q) qb.andWhere('(v.model ILIKE :kw OR v.plate_number ILIKE :kw)', { kw: `%${q.q}%` });
    if (q.buildingId) qb.andWhere('v.building_id = :bid', { bid: q.buildingId });

    // if user is host, restrict to their own vehicles
    if (user && (user.role === 'host' || user.role === 'Host')) {
      const uid = user.id ?? user.sub ?? null;
      if (uid) qb.andWhere('v.created_by = :uid', { uid });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit, pageCount: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const it = await this.repo.findOne({ where: { id } });
    if (!it) throw new NotFoundException('Vehicle not found');
    return it;
  }

  async update(id: number, dto: UpdateVehicleDto, userId?: number, userRole?: string) {
    const it = await this.repo.findOne({ where: { id } });
    if (!it) throw new NotFoundException('Vehicle not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(it.createdBy) !== String(userId)) throw new NotFoundException('Không có quyền sửa phương tiện này');
    }
    Object.assign(it, dto as any);
    return this.repo.save(it);
  }

  async remove(id: number, userId?: number, userRole?: string) {
    const it = await this.repo.findOne({ where: { id } });
    if (!it) throw new NotFoundException('Vehicle not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(it.createdBy) !== String(userId)) throw new NotFoundException('Không có quyền xóa phương tiện này');
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
