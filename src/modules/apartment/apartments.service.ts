import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Apartment } from './entities/apartment.entity';
import { User } from '../users/entities/user.entity';
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
    @InjectRepository(User) private readonly userRepo: Repository<User>,
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
    console.log(123);
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const qb = this.repo.createQueryBuilder('a')
      .take(limit)
      .skip((page - 1) * limit);

    if (q.q) {
      const kw = `%${String(q.q).toLowerCase()}%`;
      qb.andWhere('(LOWER(a.title) LIKE :kw OR LOWER(a.street_address) LIKE :kw)', { kw });
    }
    // ===== Location filter: by id OR by slug (and descendants when not a District)
    if (q.locationId) {
      qb.andWhere('a.location_id = :lid', { lid: q.locationId });
    } else if (q.locationSlug) {
      const loc = await this.locRepo.findOne({ where: { slug: q.locationSlug as any }, relations: { parent: true } });
      if (loc) {
        if ((loc as any).level === 'District') {
          qb.andWhere('a.location_id = :lid', { lid: loc.id });
        } else if ((loc as any).level === 'City') {
          // districts con trực tiếp của city
          const districts = await this.locRepo.find({ where: { parent: { id: loc.id }, level: 'District' as any } });
          const ids = districts.map(d => d.id);
          if (ids.length > 0) qb.andWhere('a.location_id IN (:...ids)', { ids });
          else qb.andWhere('1=0'); // không có district
        } else {
          // Province -> lấy cities rồi districts thuộc cities
          const cities = await this.locRepo.find({ where: { parent: { id: loc.id }, level: 'City' as any } });
          const cityIds = cities.map(c => c.id);
          if (cityIds.length === 0) {
            qb.andWhere('1=0');
          } else {
            const districts = await this.locRepo.createQueryBuilder('l')
              .where('l.level = :lv', { lv: 'District' })
              .andWhere('l.parent_id IN (:...cids)', { cids: cityIds })
              .getMany();
            const ids = districts.map(d => d.id);
            if (ids.length > 0) qb.andWhere('a.location_id IN (:...ids)', { ids });
            else qb.andWhere('1=0');
          }
        }
      } else {
        // slug không tồn tại → không trả kết quả
        qb.andWhere('1=0');
      }
    }
    if (q.buildingId) qb.andWhere('a.building_id = :bid', { bid: q.buildingId });
    if (q.status) qb.andWhere('a.status = :st', { st: q.status });
    if ((q as any).floorNumber != null) qb.andWhere('a.floor_number = :fn', { fn: (q as any).floorNumber });
    if (q.bedrooms != null) qb.andWhere('a.bedrooms >= :bed', { bed: q.bedrooms });
    if (q.bathrooms != null) qb.andWhere('a.bathrooms >= :bath', { bath: q.bathrooms });
    if (q.livingRooms != null) qb.andWhere('a.living_rooms >= :lr', { lr: q.livingRooms });
    if (q.minPrice != null) qb.andWhere('a.rent_price >= :minp', { minp: q.minPrice });
    if (q.maxPrice != null) qb.andWhere('a.rent_price <= :maxp', { maxp: q.maxPrice });

    // Discount filters
    if ((q as any).minDiscount != null) {
      qb.andWhere('COALESCE(a.discount_percent, 0) >= :mind', { mind: (q as any).minDiscount });
    }
    if ((q as any).minDiscountAmount != null) {
      qb.andWhere('COALESCE(a.discount_amount, 0) >= :mindAmt', { mindAmt: (q as any).minDiscountAmount });
    }
    if ((q as any).hasDiscount === 'true') {
      qb.andWhere('(COALESCE(a.discount_percent,0) > 0 OR COALESCE(a.discount_amount,0) > 0)');
    }

    // boolean filters
    const asBool = (v?: string) => (v === 'true' ? true : v === 'false' ? false : undefined);
    const f = {
      pb: asBool(q.hasPrivateBathroom),
      mz: asBool(q.hasMezzanine),
      ac: asBool(q.hasAirConditioner),
      wm: asBool(q.hasWashingMachine),
      sb: asBool(q.hasSharedBathroom),
      wms: asBool(q.hasWashingMachineShared),
      wmp: asBool(q.hasWashingMachinePrivate),
      desk: asBool(q.hasDesk),
      kt: asBool(q.hasKitchenTable),
      kr: asBool(q.hasRangeHood),
      fr: asBool(q.hasFridge),
      elv: asBool((q as any).hasElevator),
      pet: asBool((q as any).allowPet),
      ev: asBool((q as any).allowElectricVehicle),
    };
    if (f.pb !== undefined) qb.andWhere('a.has_private_bathroom = :pb', { pb: f.pb });
    if (f.mz !== undefined) qb.andWhere('a.has_mezzanine = :mz', { mz: f.mz });
    if (f.ac !== undefined) qb.andWhere('a.has_air_conditioner = :ac', { ac: f.ac });
    if (f.wm !== undefined) qb.andWhere('a.has_washing_machine = :wm', { wm: f.wm });
    if (f.sb !== undefined) qb.andWhere('a.has_shared_bathroom = :sb', { sb: f.sb });
    if (f.wms !== undefined) qb.andWhere('a.has_washing_machine_shared = :wms', { wms: f.wms });
    if (f.wmp !== undefined) qb.andWhere('a.has_washing_machine_private = :wmp', { wmp: f.wmp });
    if (f.desk !== undefined) qb.andWhere('a.has_desk = :desk', { desk: f.desk });
    if (f.kt !== undefined) qb.andWhere('a.has_kitchen_table = :kt', { kt: f.kt });
    if (f.kr !== undefined) qb.andWhere('a.has_range_hood = :kr', { kr: f.kr });
    if (f.fr !== undefined) qb.andWhere('a.has_fridge = :fr', { fr: f.fr });
  if (f.elv !== undefined) qb.andWhere('a.has_elevator = :elv', { elv: f.elv });
  if (f.pet !== undefined) qb.andWhere('a.allow_pet = :pet', { pet: f.pet });
  if (f.ev !== undefined) qb.andWhere('a.allow_electric_vehicle = :ev', { ev: f.ev });

    // lọc theo số ảnh tối thiểu
    if (q.minImages != null) {
      qb.andWhere(`COALESCE(a.images, '[]') <> ''`);
      qb.andWhere(
        `(CASE WHEN a.images IS NULL THEN 0 ELSE (length(a.images) - length(replace(a.images, '","', ''))) / 3 + 1 END) >= :minImgs`,
        { minImgs: q.minImages }
      );
    }

    // Sorting
    const sort = (q as any).sort as string | undefined;
    if (sort === 'discount_desc') {
      // Sắp xếp theo giá trị VND giảm thực tế: percent * price hoặc discount_amount
      qb.orderBy(`CASE 
        WHEN COALESCE(a.discount_percent,0) > 0 THEN (CAST(a.rent_price as DECIMAL(12,2)) * a.discount_percent / 100)
        WHEN COALESCE(a.discount_amount,0) > 0 THEN CAST(a.discount_amount as DECIMAL(12,2))
        ELSE 0 END`, 'DESC')
        .addOrderBy('a.created_at', 'DESC');
    } else {
      qb.orderBy('a.id', 'DESC');
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

  /** Top các căn hộ được quan tâm nhiều nhất (dựa vào lượt yêu thích). Nếu chưa có lượt yêu thích → fallback created_at DESC */
  async getMostInterested(limit = 5, currentUserId?: number) {
    // Chỉ lấy tối đa 5 phòng theo yêu cầu
    if (!limit || limit > 5) limit = 5;
    // Sử dụng subquery COUNT(f) gắn trực tiếp vào select để tránh lỗi alias join
    const qb = this.repo.createQueryBuilder('a')
      .where('a.status = :st', { st: 'published' })
      .addSelect((sub) => {
        return sub
          .select('COUNT(f.id)', 'favCount')
          .from(Favorite, 'f')
          .where('f.apartmentId = a.id'); // tham chiếu alias ngoài
      }, 'favCount')
      .orderBy('favCount', 'DESC')
      .addOrderBy('a.created_at', 'DESC')
      .take(limit);

    const { entities, raw } = await qb.getRawAndEntities();
    const withCount = entities.map((e, idx) => ({
      ...(e as Apartment),
      favCount: Number((raw[idx] as any)?.favCount ?? 0),
    }));

    // Lấy cờ favorited theo user hiện tại
    const favSet = await this.getFavIdSet(currentUserId, withCount.map(i => i.id));
    const items = withCount.map(i => ({ ...i, favorited: favSet.has(i.id) }));

    return { items };
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

    // Load owner/creator name for FE display
    let contactName: string | undefined = undefined;
    if ((apt as any).createdById) {
      const owner = await this.userRepo.findOne({ where: { id: (apt as any).createdById } });
      contactName = owner?.name || undefined;
    }

    return { ...apt, favorited, location: location || undefined, contactName } as any;
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

  /** Cập nhật URL video (đặt video ở đầu danh sách images). Nếu videoUrl trống -> xoá mọi video-like URL khỏi images */
  async updateVideo(id: number, videoUrl?: string | null) {
    const apt = await this.repo.findOne({ where: { id } });
    if (!apt) throw new NotFoundException('Apartment không tồn tại');

    const isVideoUrl = (u?: string | null) => {
      if (!u) return false;
      const s = String(u).toLowerCase();
      return (
        s.includes('/static/videos/') ||
        s.endsWith('.mp4') || s.endsWith('.webm') || s.endsWith('.ogg') || s.endsWith('.mov') ||
        s.includes('youtube.com') || s.includes('youtu.be') || s.includes('vimeo.com')
      );
    };

    const clean = (arr?: string[] | null) => Array.isArray(arr) ? arr.filter(Boolean) : [] as string[];
    let images = clean(apt.images);
    // Remove all existing video-like URLs first
    images = images.filter((u) => !isVideoUrl(u));

    const v = (videoUrl || '').trim();
    if (v) {
      // Put video first, then others (dedupe)
      const set = new Set([v, ...images]);
      images = Array.from(set);
    }

    // Ensure cover is not duplicated in images
    const cover = apt.coverImageUrl?.trim() || undefined;
    if (cover) {
      images = images.filter((u) => u !== cover);
    }

    Object.assign(apt, { images });
    await this.repo.save(apt);
    return { message: 'Video updated', images };
  }
}
