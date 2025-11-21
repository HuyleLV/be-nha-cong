import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { QueryAssetDto } from './dto/query-asset.dto';

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset) private readonly repo: Repository<Asset>,
  ) {}

  async create(dto: CreateAssetDto, userId?: number) {
    const ent = this.repo.create({ ...(dto as any), createdById: userId ?? null });
    return this.repo.save(ent);
  }

  async findAll(q: QueryAssetDto, user?: any) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo.createQueryBuilder('a').orderBy('a.id', 'DESC').take(limit).skip((page - 1) * limit);
    if (q.q) qb.andWhere('(a.name ILIKE :kw OR a.brand ILIKE :kw)', { kw: `%${q.q}%` });
    if (q.status) qb.andWhere('a.status = :st', { st: q.status });
    if (q.buildingId) qb.andWhere('a.building_id = :bid', { bid: q.buildingId });
    if (q.apartmentId) qb.andWhere('a.apartment_id = :apid', { apid: q.apartmentId });

    // If caller is host restrict to their own assets
    if (user && (user.role === 'host' || user.role === 'Host')) {
      const uid = user.id ?? user.sub ?? null;
      if (uid) qb.andWhere('a.created_by = :uid', { uid });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit, pageCount: Math.ceil(total / limit) } };
  }

  async findOne(id: number, user?: any) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Asset not found');
    if (user && (user.role === 'host' || user.role === 'Host')) {
      const uid = user.id ?? user.sub ?? null;
      if (uid && String(a.createdById) !== String(uid)) throw new ForbiddenException('Không có quyền xem tài nguyên này');
    }
    return a;
  }

  async update(id: number, dto: UpdateAssetDto, userId?: number, userRole?: string) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Asset not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(a.createdById) !== String(userId)) throw new ForbiddenException('Không có quyền sửa tài nguyên này');
    }
    Object.assign(a, dto as any);
    return this.repo.save(a);
  }

  async remove(id: number, userId?: number, userRole?: string) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Asset not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(a.createdById) !== String(userId)) throw new ForbiddenException('Không có quyền xóa tài nguyên này');
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
