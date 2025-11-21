import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './entities/building.entity';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { QueryBuildingDto } from './dto/query-building.dto';
import { Location } from 'src/modules/locations/entities/locations.entity';
import { Apartment } from 'src/modules/apartment/entities/apartment.entity';

// slug util ngắn gọn
const toSlug = (s: string) =>
  (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(Building) private readonly repo: Repository<Building>,
    @InjectRepository(Location) private readonly locRepo: Repository<Location>,
    @InjectRepository(Apartment) private readonly aptRepo: Repository<Apartment>,
  ) {}

  private async ensureUniqueSlug(locationId: number | null | undefined, raw: string) {
    const base = toSlug(raw);
    let slug = base;
    let i = 1;
    while (await this.repo.findOne({ where: { slug, locationId: locationId ?? null } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }

  async create(dto: CreateBuildingDto, userId?: number) {
    if (dto.locationId) {
      const ok = await this.locRepo.findOne({ where: { id: dto.locationId } });
      if (!ok) throw new BadRequestException('Location không tồn tại');
    }

    const slug = await this.ensureUniqueSlug(dto.locationId ?? null, dto.slug || dto.name);
    const entity = this.repo.create({
      ...dto,
      slug,
      createdBy: userId ?? null,
    });
    return this.repo.save(entity);
  }

  async findAll(q: QueryBuildingDto, user?: any) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    // Vì không khai báo @ManyToOne Location trong entity, ta join thủ công theo bảng
    const qb = this.repo.createQueryBuilder('b')
      .leftJoin(Location, 'l', 'l.id = b.location_id')
      .addSelect(['l.id', 'l.name', 'l.slug', 'l.level', 'l.parent']) // nếu muốn trả thêm trường từ l
      .orderBy('b.id', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (q.locationId) qb.andWhere('b.location_id = :lid', { lid: q.locationId });
    if (q.status) qb.andWhere('b.status = :st', { st: q.status });
    if (q.q) qb.andWhere('(b.name ILIKE :kw OR b.address ILIKE :kw)', { kw: `%${q.q}%` });

    // If caller is a host, restrict to buildings created by that host
    if (user && (user.role === 'host' || user.role === 'Host')) {
      const uid = user.id ?? user.sub;
      if (uid) qb.andWhere('b.created_by = :uid', { uid });
    }

    const [items, total] = await qb.getManyAndCount();

    // Compute apartment counts per building in a single query
    const ids = items.map(i => i.id).filter(Boolean);
    let counts: Record<number, number> = {};
    if (ids.length) {
      const raw = await this.aptRepo.createQueryBuilder('a')
        .select('a.building_id', 'buildingId')
        .addSelect('COUNT(a.id)', 'cnt')
        .where('a.building_id IN (:...ids)', { ids })
        .groupBy('a.building_id')
        .getRawMany();
      raw.forEach((r: any) => { counts[Number(r.buildingId)] = Number(r.cnt); });
    }

    // Attach apartmentCount and paymentDate (using updatedAt as proxy) to returned items
    const itemsWithExtras = items.map((it: any) => ({
      ...it,
      apartmentCount: counts[it.id] ?? 0,
      paymentDate: it.updatedAt ?? it.createdAt ?? null,
    }));

    return {
      items: itemsWithExtras,
      meta: { total, page, limit, pageCount: Math.ceil(total / limit) },
    };
  }

  async findOneByIdOrSlug(idOrSlug: number | string, user?: any) {
    const where = typeof idOrSlug === 'number'
      ? { id: idOrSlug }
      : { slug: String(idOrSlug) };

    const building = await this.repo.findOne({ where });
    if (!building) throw new NotFoundException('Building không tồn tại');

    // If caller is a host, ensure they can only view their own buildings
    if (user && (user.role === 'host' || user.role === 'Host' || user.role === 'chu_nha' || user.role === 'owner')) {
      const uid = user.id ?? user.sub ?? null;
      if (uid && String((building as any).createdBy) !== String(uid)) {
        throw new ForbiddenException('Không có quyền xem tài nguyên này');
      }
    }

    return building;
  }

  async update(id: number, dto: UpdateBuildingDto, userId?: number, userRole?: string) {
    const building = await this.repo.findOne({ where: { id } });
    if (!building) throw new NotFoundException('Building không tồn tại');

    if (dto.locationId) {
      const ok = await this.locRepo.findOne({ where: { id: dto.locationId } });
      if (!ok) throw new BadRequestException('Location không tồn tại');
    }

    // nếu đổi name/slug/locationId → tính lại slug đảm bảo unique trong location
    let slug = building.slug;
    if (dto.slug || dto.name || dto.locationId !== undefined) {
      const targetLocId = dto.locationId ?? building.locationId ?? null;
      slug = await this.ensureUniqueSlug(targetLocId, dto.slug || dto.name || building.name);
    }

    // if caller is host, ensure ownership
    if (userRole && (userRole === 'host' || userRole === 'Host' || userRole === 'chu_nha' || userRole === 'owner')) {
      const uid = userId ?? null;
      if (String(building.createdBy) !== String(uid)) throw new ForbiddenException('Không có quyền sửa tài nguyên này');
    }

    Object.assign(building, { ...dto, slug });
    return this.repo.save(building);
  }

  async remove(id: number, userId?: number, userRole?: string) {
    const ok = await this.repo.findOne({ where: { id } });
    if (!ok) throw new NotFoundException('Building không tồn tại');

    if (userRole && (userRole === 'host' || userRole === 'Host' || userRole === 'chu_nha' || userRole === 'owner')) {
      const uid = userId ?? null;
      if (String(ok.createdBy) !== String(uid)) throw new ForbiddenException('Không có quyền xóa tài nguyên này');
    }

    await this.repo.delete(id);
    return { success: true };
  }
}