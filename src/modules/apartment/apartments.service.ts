import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Apartment } from './entities/apartment.entity';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';
import { QueryApartmentDto } from './dto/query-apartment.dto';
import { Location } from '../locations/entities/locations.entity';
import { Building } from '../building/entities/building.entity';
import { Favorite } from '../favorites/entities/favorite.entity'; 

// slug helper
const toSlug = (s: string) =>
  (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');

type ApartmentWithFav = Apartment & { favorited: boolean };

@Injectable()
export class ApartmentsService {
  constructor(
    @InjectRepository(Apartment) private readonly repo: Repository<Apartment>,
    @InjectRepository(Location) private readonly locRepo: Repository<Location>,
    @InjectRepository(Building) private readonly bRepo: Repository<Building>,
    @InjectRepository(Favorite) private readonly favRepo: Repository<Favorite>,
  ) {}

  private async ensureUniqueSlug(raw: string) {
    const base = toSlug(raw);
    let slug = base;
    let i = 1;
    while (await this.repo.findOne({ where: { slug } })) slug = `${base}-${i++}`;
    return slug;
  }

  private async assertRefs(locationId: number, buildingId?: number | null) {
    const loc = await this.locRepo.findOne({ where: { id: locationId } });
    if (!loc) throw new BadRequestException('Location không tồn tại');

    if (buildingId != null) {
      const b = await this.bRepo.findOne({ where: { id: buildingId } });
      if (!b) throw new BadRequestException('Building không tồn tại');
    }
  }

  /** Trả về tập apartmentId user đã yêu thích trong số ids truyền vào */
  private async getFavIdSet(userId?: number | null, aptIds?: number[]) {
    if (!userId || !aptIds?.length) return new Set<number>();
    const favs = await this.favRepo.find({
      select: ['apartmentId'],
      where: { userId, apartmentId: In(aptIds) },
    });
    return new Set(favs.map(f => f.apartmentId));
  }

  async create(dto: CreateApartmentDto, userId?: number) {
    await this.assertRefs(dto.locationId, dto.buildingId ?? null);
    const slug = await this.ensureUniqueSlug(dto.slug || dto.title);

    // chuẩn hoá images và tách cover ra riêng
    const cover = dto.coverImageUrl?.trim() || undefined;
    const images = Array.isArray(dto.images)
      ? [...new Set(dto.images.filter(Boolean))].filter((u) => u !== cover)
      : undefined;

    const entity = this.repo.create({
      ...dto,
      slug,
      images,
      currency: dto.currency ?? 'VND',
      status: dto.status ?? 'draft',
      createdById: userId ?? null,
    });
    return this.repo.save(entity);
  }

  /** Danh sách + cờ favorited cho user hiện tại (nếu có) */
  async findAll(q: QueryApartmentDto, currentUserId?: number) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const qb = this.repo.createQueryBuilder('a')
      .orderBy('a.id', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (q.q) qb.andWhere('(a.title ILIKE :kw OR a.street_address ILIKE :kw)', { kw: `%${q.q}%` });
    if (q.locationId) qb.andWhere('a.location_id = :lid', { lid: q.locationId });
    if (q.buildingId) qb.andWhere('a.building_id = :bid', { bid: q.buildingId });
    if (q.status) qb.andWhere('a.status = :st', { st: q.status });
    if (q.bedrooms != null) qb.andWhere('a.bedrooms >= :bed', { bed: q.bedrooms });
    if (q.bathrooms != null) qb.andWhere('a.bathrooms >= :bath', { bath: q.bathrooms });
    if (q.minPrice != null) qb.andWhere('a.rent_price >= :minp', { minp: q.minPrice });
    if (q.maxPrice != null) qb.andWhere('a.rent_price <= :maxp', { maxp: q.maxPrice });

    // boolean filters
    const asBool = (v?: string) => (v === 'true' ? true : v === 'false' ? false : undefined);
    const f = {
      pb: asBool(q.hasPrivateBathroom),
      mz: asBool(q.hasMezzanine),
      ac: asBool(q.hasAirConditioner),
      wm: asBool(q.hasWashingMachine),
    };
    if (f.pb !== undefined) qb.andWhere('a.has_private_bathroom = :pb', { pb: f.pb });
    if (f.mz !== undefined) qb.andWhere('a.has_mezzanine = :mz', { mz: f.mz });
    if (f.ac !== undefined) qb.andWhere('a.has_air_conditioner = :ac', { ac: f.ac });
    if (f.wm !== undefined) qb.andWhere('a.has_washing_machine = :wm', { wm: f.wm });

    // lọc theo số ảnh tối thiểu
    if (q.minImages != null) {
      qb.andWhere(`COALESCE(a.images, '[]') <> ''`);
      qb.andWhere(
        `(CASE WHEN a.images IS NULL THEN 0 ELSE (length(a.images) - length(replace(a.images, '","', ''))) / 3 + 1 END) >= :minImgs`,
        { minImgs: q.minImages }
      );
    }

    const [items, total] = await qb.getManyAndCount();

    // === favorited map ===
    const favSet = await this.getFavIdSet(currentUserId, items.map(i => i.id));
    const itemsWithFav = items.map(i => ({ ...i, favorited: favSet.has(i.id) }));

    return {
      items: itemsWithFav,
      meta: { total, page, limit, pageCount: Math.ceil(total / limit) },
    };
  }

  async getHomeSections(
    citySlug: string,
    limitPerDistrict = 4,
    currentUserId?: number,
  ) {
    // 1) City theo slug (bất kỳ cấp không phải district)
    const city = await this.locRepo.createQueryBuilder('c')
      .where('c.slug = :slug', { slug: citySlug })
      .andWhere("LOWER(c.level) <> 'district'")
      .getOne();

    if (!city) throw new NotFoundException('Không tìm thấy thành phố');

    // 2) Districts con của city
    const districts = await this.locRepo.find({
      where: { parent: { id: city.id }, level: 'District' as any },
      order: { name: 'ASC' },
    });

    if (!districts.length) {
      return {
        city: { id: city.id, name: city.name, slug: city.slug, level: city.level },
        sections: [],
      };
    }

    const districtIds = districts.map(d => d.id);

    // 3) Toàn bộ apartment published thuộc các quận đó (FULL entity)
    const rawApts = await this.repo.createQueryBuilder('a')
      .where('a.status = :st', { st: 'published' })
      .andWhere('a.location_id IN (:...ids)', { ids: districtIds })
      .orderBy('a.created_at', 'DESC')
      .getMany();

    if (!rawApts.length) {
      return {
        city: { id: city.id, name: city.name, slug: city.slug, level: city.level },
        sections: [],
      };
    }

    // 4) Group theo locationId (không join)
    const byDistrict = new Map<number, Apartment[]>();
    for (const a of rawApts) {
      const lid = (a as any).locationId as number; // đảm bảo entity có field locationId
      if (!byDistrict.has(lid)) byDistrict.set(lid, []);
      byDistrict.get(lid)!.push(a);
    }

    // 5) Map yêu thích (1 query tổng)
    const allIds = rawApts.map(a => a.id);
    const favSet = await this.getFavIdSet(currentUserId, allIds);

    // 6) Build sections (full apartment + favorited)
    const sections = districts
      .map(d => {
        const arr = (byDistrict.get(d.id) || []).slice(0, limitPerDistrict);
        const apartments: ApartmentWithFav[] = arr.map(a => ({
          ...(a as Apartment),
          favorited: favSet.has(a.id),
        }));
        return {
          district: { id: d.id, name: d.name, slug: d.slug, level: d.level },
          apartments,
        };
      })
      .filter(s => s.apartments.length > 0);

    return {
      city: { id: city.id, name: city.name, slug: city.slug, level: city.level },
      sections,
    };
  }
  

  /** Chi tiết + cờ favorited (JOIN với favorite) */
  async findOneByIdOrSlug(idOrSlug: number | string, currentUserId?: number) {
    const qb = this.repo.createQueryBuilder('a');
    
    // Điều kiện tìm theo id hoặc slug
    if (typeof idOrSlug === 'number') {
      qb.where('a.id = :id', { id: idOrSlug });
    } else {
      qb.where('a.slug = :slug', { slug: String(idOrSlug) });
    }

    const apt = await qb.getOne();
    if (!apt) throw new NotFoundException('Apartment không tồn tại');

    // Lấy cờ favorited
    const favSet = await this.getFavIdSet(currentUserId, [apt.id]);
    const favorited = favSet.has(apt.id);

    // Nạp thông tin location dựa theo locationId để FE hiển thị khu vực khi update
    let location: Location | null = null;
    if ((apt as any).locationId) {
      location = await this.locRepo.findOne({ where: { id: (apt as any).locationId } });
    }

    return { ...apt, favorited, location: location || undefined } as any;
  }

  async update(id: number, dto: UpdateApartmentDto) {
  const apt = await this.repo.findOne({ where: { id } });
    if (!apt) throw new NotFoundException('Apartment không tồn tại');

    const nextLocationId = dto.locationId ?? apt.locationId;
    const nextBuildingId = dto.buildingId === undefined ? apt.buildingId : dto.buildingId;
    await this.assertRefs(nextLocationId, nextBuildingId ?? null);

    let slug = apt.slug;
    if (dto.slug || dto.title) slug = await this.ensureUniqueSlug(dto.slug || dto.title || apt.title);

    // xử lý images theo strategy + đảm bảo tách cover khỏi images
    const nextCover = dto.coverImageUrl !== undefined ? (dto.coverImageUrl?.trim() || null) : apt.coverImageUrl;
    let images = apt.images;
    if (dto.images) {
      images = [...new Set(dto.images.filter(Boolean))];
    }
    if (Array.isArray(images) && nextCover) {
      images = images.filter((u) => u !== nextCover);
    }

    Object.assign(apt, { ...dto, slug, images, coverImageUrl: nextCover as any });
    return this.repo.save(apt);
  }

  async remove(id: number) {
    const ok = await this.repo.findOne({ where: { id } });
    if (!ok) throw new NotFoundException('Apartment không tồn tại');
    await this.repo.delete(id);
    return { success: true };
  }
}
