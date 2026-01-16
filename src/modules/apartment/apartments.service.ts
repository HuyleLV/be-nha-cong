import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Apartment } from './entities/apartment.entity';
import { Asset } from '../asset/entities/asset.entity';
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
    @InjectRepository(Asset) private readonly assetRepo: Repository<Asset>,
  ) { }

  /**
   * Optimized viewport-based search for Map
   * Returns lightweight objects to reduce payload size
   */
  async getApartmentsByBounds(
    south: number,
    north: number,
    west: number,
    east: number,
    user?: any
  ) {
    const qb = this.repo.createQueryBuilder('a')
      .select(['a.id', 'a.title', 'a.rentPrice', 'a.areaM2', 'a.lat', 'a.lng', 'a.coverImageUrl', 'a.slug', 'a.roomStatus'])
      .where('a.status = :pub', { pub: 'published' })
      .andWhere('a.is_approved = true')
      // Ensure we have valid coordinates
      .andWhere('a.lat IS NOT NULL AND a.lng IS NOT NULL')
      // Bounding Box Logic
      .andWhere('a.lat BETWEEN :south AND :north', { south, north })
      .andWhere('a.lng BETWEEN :west AND :east', { west, east });

    // Restrict public view to 'o_ngay' to align with list view public policy
    // But map often wants to show everything, let's keep it consistent with findAll
    const isAdmin = user && (user.role === 'admin' || user.role === 'Admin');
    if (!isAdmin) {
      qb.andWhere('a.room_status = :rs', { rs: 'o_ngay' });
    }

    const items = await qb.getMany();

    // Map to lightweight response
    return items.map(i => ({
      id: i.id,
      title: i.title,
      price: i.rentPrice,
      area: i.areaM2,
      lat: Number(i.lat),
      lng: Number(i.lng),
      thumb: i.coverImageUrl,
      slug: i.slug,
    }));
  }

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

  async create(dto: CreateApartmentDto, userId?: number, userRole?: string) {
    await this.assertRefs(dto.locationId, dto.buildingId ?? null);
    const slug = await this.ensureUniqueSlug(dto.slug || dto.title);

    // chuẩn hoá images và tách cover ra riêng
    const cover = dto.coverImageUrl?.trim() || undefined;
    const images = Array.isArray(dto.images)
      ? [...new Set(dto.images.filter(Boolean))].filter((u) => u !== cover)
      : undefined;

    const isAdmin = userRole && (userRole === 'admin' || userRole === 'Admin');
    // approval default: admin-created -> approved by default, host-created -> not approved
    const isApprovedVal = isAdmin ? (dto.isApproved ?? true) : false;

    const entity = this.repo.create({
      ...dto,
      slug,
      images,
      currency: dto.currency ?? 'VND',
      status: dto.status ?? 'draft',
      createdById: userId ?? null,
      isApproved: isApprovedVal,
    });

    // If creator is a host (not admin), relax commission_amount handling:
    // - Treat empty string or missing commissionAmount as null to avoid DB numeric errors
    // - Do not enforce any further constraints here; admins can still set commissionAmount explicitly
    if (!isAdmin) {
      try {
        const ca = (dto as any).commissionAmount;
        if (ca === undefined || ca === null || (typeof ca === 'string' && String(ca).trim() === '')) {
          (entity as any).commissionAmount = null;
        }
      } catch (e) {
        // ignore
      }
    }

    // Save entity first to obtain generated id
    const saved = await this.repo.save(entity);

    // Ensure roomCode equals numeric id (string) when not explicitly provided
    if (!saved.roomCode) {
      saved.roomCode = String(saved.id);
      await this.repo.save(saved);
    }

    return saved;
  }

  /** Danh sách + cờ favorited cho user hiện tại (nếu có) */
  async findAll(q: QueryApartmentDto, user?: any) {
    const page = q.page ?? 1;
    // Default limit: allow admin to fetch the full dataset when they don't provide a limit.
    // For regular users/hosts keep the default paging of 20.
    let limit = q.limit ?? 20;
    if (user && (user.role === 'admin' || user.role === 'Admin')) {
      if (q.limit == null) limit = 1000000;
    }

    const currentUserId = user?.id ?? user?.sub ?? undefined;
    const isAdminCaller = user && (user.role === 'admin' || user.role === 'Admin');
    const isHostCaller = user && (user.role === 'host' || user.role === 'Host' || user.role === 'chu_nha' || user.role === 'owner');

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

    // Public visibility: only show published AND approved apartments for non-admin, non-host callers
    if (!isAdminCaller && !isHostCaller) {
      qb.andWhere('a.status = :pub', { pub: 'published' });
      qb.andWhere('a.is_approved = true');
      // Only show rooms that are currently available ('o_ngay') to public callers.
      qb.andWhere('a.room_status = :rs', { rs: 'o_ngay' });
    }
    // If caller provided explicit isApproved filter (e.g. admin UI), apply it.
    if ((q as any).isApproved != null) {
      const raw = (q as any).isApproved;
      const val = raw === true || raw === 'true' || raw === 1 || raw === '1';
      qb.andWhere('a.is_approved = :iap', { iap: val });
    }
    if ((q as any).floorNumber != null) qb.andWhere('a.floor_number = :fn', { fn: (q as any).floorNumber });
    if (q.bedrooms != null) qb.andWhere('a.bedrooms >= :bed', { bed: q.bedrooms });
    if (q.bathrooms != null) qb.andWhere('a.bathrooms >= :bath', { bath: q.bathrooms });
    if (q.livingRooms != null) qb.andWhere('a.living_rooms >= :lr', { lr: q.livingRooms });
    if (q.minPrice != null) qb.andWhere('a.rent_price >= :minp', { minp: q.minPrice });
    if (q.maxPrice != null) qb.andWhere('a.rent_price <= :maxp', { maxp: q.maxPrice });

    // Discount filters
    if ((q as any).minDiscountAmount != null) {
      qb.andWhere('COALESCE(a.discount_amount, 0) >= :mindAmt', { mindAmt: (q as any).minDiscountAmount });
    }
    if ((q as any).hasDiscount === 'true') {
      // Only consider fixed amount discounts (discount_amount) — percent-based discounts were removed
      qb.andWhere('COALESCE(a.discount_amount,0) > 0');
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
    if (sort === 'discount_desc' || sort === 'fill_payment_desc') {
      // Some complex ordering expressions previously caused TypeORM to attempt
      // metadata lookups for aliased expressions and crash (reading databaseName).
      // To avoid runtime errors, fallback to stable ordering by id then created_at.
      // This preserves deterministic ordering while avoiding TypeORM parsing bugs.
      qb.orderBy('a.id', 'DESC').addOrderBy('a.created_at', 'DESC');
    } else {
      qb.orderBy('a.id', 'DESC');
    }

    // If caller is a host, restrict to apartments created by that host
    if (isHostCaller) {
      const uid = currentUserId ?? null;
      // DB column is named `created_by` (entity maps createdById -> created_by)
      if (uid) qb.andWhere('a.created_by = :uid', { uid });
    }

    // Debug: dump SQL and expressionMap to diagnose TypeORM order-by metadata issue
    try {
      // eslint-disable-next-line no-console
      console.debug('[apartments.findAll] SQL:', (qb as any).getSql ? (qb as any).getSql() : 'no getSql');
      // eslint-disable-next-line no-console
      console.debug('[apartments.findAll] params:', (qb as any).getParameters ? (qb as any).getParameters() : {});
      // eslint-disable-next-line no-console
      console.debug('[apartments.findAll] expressionMap.selects:', (qb as any).expressionMap?.selects);
      // eslint-disable-next-line no-console
      console.debug('[apartments.findAll] expressionMap.orderBys:', (qb as any).expressionMap?.orderBys);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[apartments.findAll] debug dump failed', err);
    }

    const items = await qb.getMany();
    // Build a count query without pagination
    const countQb = qb.clone().skip(undefined as any).take(undefined as any);
    const total = await countQb.getCount();

    // === favorited map ===
    const favSet = await this.getFavIdSet(currentUserId, items.map(i => i.id));

    // Fetch owner summaries in a separate query to avoid TypeORM select/orderBy
    // edge-cases. This keeps the main query simple and stable.
    const ownerIds = Array.from(new Set(items.map(i => (i as any).createdById).filter(Boolean)));
    const owners = ownerIds.length ? await this.userRepo.findBy({ id: In(ownerIds) }) : [];
    const ownerMap = new Map(owners.map(o => [o.id, o]));

    // Sanitize owner info and attach minimal owner summary to each item
    const itemsWithOwner = items.map(i => {
      const rawOwner = ownerMap.get((i as any).createdById as number) as any | undefined;
      const owner = rawOwner ? {
        id: rawOwner.id,
        name: rawOwner.name ?? rawOwner.displayName ?? undefined,
        avatarUrl: rawOwner.avatarUrl ?? rawOwner.avatar_url ?? undefined,
        email: rawOwner.email ?? undefined,
      } : null;
      return {
        ...i,
        favorited: favSet.has(i.id),
        owner,
      };
    });

    return {
      items: itemsWithOwner,
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
      .andWhere('a.is_approved = true')
      // Only include rooms that are currently available ('o_ngay') in home sections
      .andWhere('a.room_status = :rs', { rs: 'o_ngay' })
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
      .andWhere('a.is_approved = true')
      // Only include rooms that are currently available ('o_ngay') in the most-interested list
      .andWhere('a.room_status = :rs', { rs: 'o_ngay' })
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

  /**
   * Trả về danh sách căn hộ "còn trống": không có hợp đồng còn hiệu lực (active/expiring_soon)
   * và không có đơn đặt cọc có giá trị (pending/signed).
   */
  async findAvailable(q: any, user?: any) {
    const page = Number(q?.page) || 1;
    const limit = Number(q?.limit) || 20;

    // Base query to count matching apartments (no asset aggregation)
    const baseQb = this.repo.createQueryBuilder('a')
      .leftJoin('contracts', 'c', "c.apartment_id = a.id AND c.status IN (:...cs)", { cs: ['active', 'expiring_soon'] })
      .leftJoin('deposits', 'd', "d.apartment_id = a.id AND d.status IN (:...ds)", { ds: ['pending', 'signed'] })
      .where('c.id IS NULL')
      .andWhere('d.id IS NULL');

    if (q.locationId) baseQb.andWhere('a.location_id = :lid', { lid: q.locationId });
    if (q.buildingId) baseQb.andWhere('a.building_id = :bid', { bid: q.buildingId });

    // Restrict to host's own apartments when caller is a host
    const isHost = user && (user.role === 'host' || user.role === 'Host' || user.role === 'chu_nha' || user.role === 'owner');
    const uid = user?.id ?? user?.sub ?? null;
    if (isHost && uid) {
      baseQb.andWhere('a.created_by = :uid', { uid });
    }

    const total = await baseQb.getCount();

    // Get paged apartment ids using same filters & ordering
    const idsQb = baseQb.clone()
      .select('a.id', 'id')
      .orderBy('a.id', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    const idRows = await idsQb.getRawMany();
    const aptIds = idRows.map((r: any) => r.id).filter(Boolean) as number[];

    // Fetch apartment entities in the same order
    let entities = [] as Apartment[];
    if (aptIds.length) {
      const ents = await this.repo.findBy({ id: In(aptIds) });
      // preserve ordering
      const entMap = new Map(ents.map(e => [e.id, e]));
      entities = aptIds.map(id => entMap.get(id)).filter(Boolean) as Apartment[];
    }

    // Load related location/building names
    const locIds = Array.from(new Set(entities.map(it => (it as any).locationId).filter(Boolean)));
    const bIds = Array.from(new Set(entities.map(it => (it as any).buildingId).filter(Boolean)));
    const locs = locIds.length ? await this.locRepo.findBy({ id: In(locIds) }) : [];
    const blds = bIds.length ? await this.bRepo.findBy({ id: In(bIds) }) : [];
    const locMap = new Map(locs.map((l: any) => [l.id, l]));
    const bMap = new Map(blds.map((b: any) => [b.id, b]));

    // Fetch assets for the apartments in one query and group them
    const assets = aptIds.length ? await this.assetRepo.find({ where: { apartmentId: In(aptIds) } }) : [];
    const assetsByApt = new Map<number, any[]>();
    for (const as of assets) {
      const list = assetsByApt.get(as.apartmentId) ?? [];
      list.push(as);
      assetsByApt.set(as.apartmentId, list);
    }

    const rows = entities.map(it => ({
      ...it,
      locationName: locMap.get((it as any).locationId)?.name ?? null,
      buildingName: bMap.get((it as any).buildingId)?.name ?? null,
      assets: assetsByApt.get(it.id) ?? [],
    }));

    return { items: rows, meta: { total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) } };
  }

  /**
   * Trả về danh sách căn hộ theo `roomStatus` (ví dụ: 'sap_trong')
   * Endpoint báo cáo dùng để trả về các căn hộ với trường roomStatus đã được set.
   */
  async findByRoomStatus(q: any, user?: any) {
    const page = Number(q?.page) || 1;
    const limit = Number(q?.limit) || 20;
    const status = q?.status ?? q?.roomStatus ?? null;

    if (!status) return { items: [], meta: { total: 0, page, limit, pageCount: 1 } };

    // Only allow public callers to request 'o_ngay' (available) rooms.
    const isAdminCaller = user && (user.role === 'admin' || user.role === 'Admin');
    const isHostCaller = user && (user.role === 'host' || user.role === 'Host' || user.role === 'chu_nha' || user.role === 'owner');
    if (!isAdminCaller && !isHostCaller) {
      // If client asks for anything other than 'o_ngay', return empty set to public callers.
      if (String(status) !== 'o_ngay') {
        return { items: [], meta: { total: 0, page, limit, pageCount: 1 } };
      }
    }

    const baseQb = this.repo.createQueryBuilder('a')
      .where('a.room_status = :rs', { rs: String(status) });

    if (q.locationId) baseQb.andWhere('a.location_id = :lid', { lid: q.locationId });
    if (q.buildingId) baseQb.andWhere('a.building_id = :bid', { bid: q.buildingId });

    // Restrict to host's own apartments when caller is a host
    const isHost = user && (user.role === 'host' || user.role === 'Host' || user.role === 'chu_nha' || user.role === 'owner');
    const uid = user?.id ?? user?.sub ?? null;
    if (isHost && uid) {
      baseQb.andWhere('a.created_by = :uid', { uid });
    }

    const total = await baseQb.getCount();

    const idsQb = baseQb.clone()
      .select('a.id', 'id')
      .orderBy('a.id', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    const idRows = await idsQb.getRawMany();
    const aptIds = idRows.map((r: any) => r.id).filter(Boolean) as number[];

    let entities: Apartment[] = [];
    if (aptIds.length) {
      const ents = await this.repo.findBy({ id: In(aptIds) });
      const entMap = new Map(ents.map(e => [e.id, e]));
      entities = aptIds.map(id => entMap.get(id)).filter(Boolean) as Apartment[];
    }

    // Load related location/building names
    const locIds = Array.from(new Set(entities.map(it => (it as any).locationId).filter(Boolean)));
    const bIds = Array.from(new Set(entities.map(it => (it as any).buildingId).filter(Boolean)));
    const locs = locIds.length ? await this.locRepo.findBy({ id: In(locIds) }) : [];
    const blds = bIds.length ? await this.bRepo.findBy({ id: In(bIds) }) : [];
    const locMap = new Map(locs.map((l: any) => [l.id, l]));
    const bMap = new Map(blds.map((b: any) => [b.id, b]));

    // Fetch assets for the apartments in one query and group them
    const assets = aptIds.length ? await this.assetRepo.find({ where: { apartmentId: In(aptIds) } }) : [];
    const assetsByApt = new Map<number, any[]>();
    for (const as of assets) {
      const list = assetsByApt.get(as.apartmentId) ?? [];
      list.push(as);
      assetsByApt.set(as.apartmentId, list);
    }

    const rows = entities.map(it => ({
      ...it,
      locationName: locMap.get((it as any).locationId)?.name ?? null,
      buildingName: bMap.get((it as any).buildingId)?.name ?? null,
      assets: assetsByApt.get(it.id) ?? [],
    }));

    return { items: rows, meta: { total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) } };
  }


  /** Chi tiết + cờ favorited (JOIN với favorite) */
  async findOneByIdOrSlug(idOrSlug: number | string, user?: any) {
    const qb = this.repo.createQueryBuilder('a');

    // Điều kiện tìm theo id hoặc slug
    if (typeof idOrSlug === 'number') {
      qb.where('a.id = :id', { id: idOrSlug });
    } else {
      qb.where('a.slug = :slug', { slug: String(idOrSlug) });
    }

    const apt = await qb.getOne();
    if (!apt) throw new NotFoundException('Apartment không tồn tại');

    // If caller is a host, ensure they own this apartment
    const isAdmin = user && (user.role === 'admin' || user.role === 'Admin');
    const isHost = user && (user.role === 'host' || user.role === 'Host' || user.role === 'chu_nha' || user.role === 'owner');
    const uid = user?.id ?? user?.sub ?? null;
    if (isHost) {
      if (uid && String(apt.createdById) !== String(uid)) {
        throw new ForbiddenException('Không có quyền xem tài nguyên này');
      }
    }

    // Public callers (non-admin and non-owner host) can only see apartments that are published AND approved
    const isOwner = isHost && uid && String(apt.createdById) === String(uid);
    if (!isAdmin && !isOwner) {
      if (apt.status !== 'published' || !(apt as any).isApproved) {
        throw new NotFoundException('Apartment không tồn tại');
      }
    }

    const currentUserId = user?.id ?? user?.sub ?? undefined;
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

  async update(id: number, dto: UpdateApartmentDto, userId?: number, userRole?: string) {
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

    // If caller is host, enforce ownership
    if (userRole && (userRole === 'host' || userRole === 'Host' || userRole === 'chu_nha' || userRole === 'owner')) {
      const uid = userId ?? null;
      if (String(apt.createdById) !== String(uid)) throw new ForbiddenException('Không có quyền sửa tài nguyên này');
    }

    // Only admin may change approval flag
    if (dto.isApproved !== undefined) {
      const isAdmin = userRole && (userRole === 'admin' || userRole === 'Admin');
      if (!isAdmin) {
        throw new ForbiddenException('Không có quyền thay đổi trạng thái duyệt');
      }
    }

    Object.assign(apt, { ...dto, slug, images, coverImageUrl: nextCover as any });
    return this.repo.save(apt);
  }

  async remove(id: number, userId?: number, userRole?: string) {
    const ok = await this.repo.findOne({ where: { id } });
    if (!ok) throw new NotFoundException('Apartment không tồn tại');

    if (userRole && (userRole === 'host' || userRole === 'Host' || userRole === 'chu_nha' || userRole === 'owner')) {
      const uid = userId ?? null;
      if (String(ok.createdById) !== String(uid)) throw new ForbiddenException('Không có quyền xóa tài nguyên này');
    }

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
