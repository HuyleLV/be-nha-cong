import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './entities/building.entity';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { QueryBuildingDto } from './dto/query-building.dto';
import { Location } from 'src/modules/locations/entities/locations.entity';

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

  async findAll(q: QueryBuildingDto) {
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

    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      meta: { total, page, limit, pageCount: Math.ceil(total / limit) },
    };
  }

  async findOneByIdOrSlug(idOrSlug: number | string) {
    const where = typeof idOrSlug === 'number'
      ? { id: idOrSlug }
      : { slug: String(idOrSlug) };

    const building = await this.repo.findOne({ where });
    if (!building) throw new NotFoundException('Building không tồn tại');
    return building;
  }

  async update(id: number, dto: UpdateBuildingDto) {
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

    Object.assign(building, { ...dto, slug });
    return this.repo.save(building);
  }

  async remove(id: number) {
    const ok = await this.repo.findOne({ where: { id } });
    if (!ok) throw new NotFoundException('Building không tồn tại');
    await this.repo.delete(id);
    return { success: true };
  }
}