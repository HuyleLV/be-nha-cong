// src/apartments/apartments.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Apartment } from './entities/apartment.entity';
import { Location } from '../locations/entities/locations.entity';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';
import { QueryApartmentDto } from './dto/query-apartment.dto';
import { makeSlug } from 'src/common/helpers/slug.helper';

@Injectable()
export class ApartmentsService {
  constructor(
    @InjectRepository(Apartment) private readonly repo: Repository<Apartment>,
    @InjectRepository(Location) private readonly locRepo: Repository<Location>,
  ) {}

  private async ensureLocation(locationId: number) {
    const loc = await this.locRepo.findOne({ where: { id: locationId } });
    if (!loc) throw new BadRequestException('Location not found');
    return loc;
  }

  private async assertSlugUnique(slug: string, excludeId?: number) {
    const existed = await this.repo.findOne({ where: { slug } });
    if (existed && existed.id !== excludeId) {
      throw new BadRequestException('Slug already exists');
    }
  }

  async create(dto: CreateApartmentDto, userIdFromReq?: number) {
    const slug = dto.slug?.trim() || makeSlug(dto.title);
    if (!slug) throw new BadRequestException('Invalid slug');
    await this.assertSlugUnique(slug);

    const location = await this.ensureLocation(dto.locationId);

    const createdById = userIdFromReq ?? dto.createdById;
    if (!createdById) throw new BadRequestException('createdById is required');

    const entity = this.repo.create({
      title: dto.title,
      slug,
      excerpt: dto.excerpt,
      description: dto.description,
      location,
      streetAddress: dto.streetAddress,

      // decimal/numeric fields trong entity là string → lưu .toString()
      lat: dto.lat,
      lng: dto.lng,
      areaM2: dto.areaM2,
      rentPrice: dto.rentPrice,

      bedrooms: dto.bedrooms ?? 0,
      bathrooms: dto.bathrooms ?? 0,

      currency: dto.currency ?? 'VND',
      status: dto.status ?? 'draft',
      coverImageUrl: dto.coverImageUrl,

      // phí dịch vụ
      electricityPricePerKwh: dto.electricityPricePerKwh,
      waterPricePerM3: dto.waterPricePerM3,
      internetPricePerRoom: dto.internetPricePerRoom,
      commonServiceFeePerPerson: dto.commonServiceFeePerPerson,

      // nội thất
      hasAirConditioner: dto.hasAirConditioner ?? false,
      hasWaterHeater: dto.hasWaterHeater ?? false,
      hasKitchenCabinet: dto.hasKitchenCabinet ?? false,
      hasWashingMachine: dto.hasWashingMachine ?? false,
      hasWardrobe: dto.hasWardrobe ?? false,

      // tiện nghi
      hasPrivateBathroom: dto.hasPrivateBathroom ?? false,
      hasMezzanine: dto.hasMezzanine ?? false,
      noOwnerLiving: dto.noOwnerLiving ?? false,
      flexibleHours: dto.flexibleHours ?? false,

      createdById,
    });

    return this.repo.save(entity);
  }

  async findAll(q: QueryApartmentDto) {
    const page  = Number(q.page)  || 1;
    const limit = Number(q.limit) || 20;

    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.location', 'l')
      .leftJoinAndSelect('l.parent', 'p') // lấy tỉnh/thành nếu cần
      .take(limit)
      .skip((page - 1) * limit);

    // ===== Sắp xếp =====
    switch (q.sort) {
      case 'price_asc':
        qb.orderBy('a.rentPrice', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('a.rentPrice', 'DESC');
        break;
      case 'area_desc':
        qb.orderBy('a.areaM2', 'DESC');
        break;
      case 'newest':
      default:
        qb.orderBy('a.createdAt', 'DESC');
        break;
    }

    // ===== By location =====
    if (q.locationId)   qb.andWhere('l.id = :lid',      { lid: q.locationId });
    if (q.locationSlug) qb.andWhere('l.slug = :lslug',  { lslug: q.locationSlug });

    // ===== Status =====
    if (q.status) qb.andWhere('a.status = :st', { st: q.status });

    // ===== Text search =====
    if (q.q) {
      const kw = `%${q.q.toLowerCase()}%`;
      qb.andWhere(new Brackets((w) => {
        w.where('LOWER(a.title) LIKE :kw', { kw })
         .orWhere('LOWER(a.excerpt) LIKE :kw', { kw })
         .orWhere('LOWER(a.description) LIKE :kw', { kw })
         .orWhere('LOWER(l.name) LIKE :kw', { kw })
         .orWhere('LOWER(p.name) LIKE :kw', { kw });
      }));
    }

    // ===== Numeric filters =====
    if (q.bedrooms  != null) qb.andWhere('a.bedrooms  >= :bed',  { bed: q.bedrooms });
    if (q.bathrooms != null) qb.andWhere('a.bathrooms >= :bath', { bath: q.bathrooms });

    // rentPrice: numeric(12,2) trong DB → so sánh số
    if (q.minPrice != null) qb.andWhere('a.rentPrice >= :minp', { minp: q.minPrice });
    if (q.maxPrice != null) qb.andWhere('a.rentPrice <= :maxp', { maxp: q.maxPrice });

    // areaM2: numeric(7,2) trong DB
    if (q.minArea  != null) qb.andWhere('a.areaM2 >= :mina', { mina: q.minArea });
    if (q.maxArea  != null) qb.andWhere('a.areaM2 <= :maxa', { maxa: q.maxArea });

    // ===== Boolean amenities (chỉ lọc khi client gửi true) =====
    if (q.hasPrivateBathroom === true) qb.andWhere('a.hasPrivateBathroom = true');
    if (q.hasMezzanine === true)       qb.andWhere('a.hasMezzanine = true');
    if (q.noOwnerLiving === true)      qb.andWhere('a.noOwnerLiving = true');
    if (q.flexibleHours === true)      qb.andWhere('a.flexibleHours = true');

    if (q.hasAirConditioner === true)  qb.andWhere('a.hasAirConditioner = true');
    if (q.hasWaterHeater === true)     qb.andWhere('a.hasWaterHeater = true');
    if (q.hasWashingMachine === true)  qb.andWhere('a.hasWashingMachine = true');
    if (q.hasWardrobe === true)        qb.andWhere('a.hasWardrobe = true');

    const [items, total] = await qb.getManyAndCount();

    const mapped = items.map((apt) => ({
      ...apt,
      addressPath: [apt.location?.name, apt.location?.parent?.name].filter(Boolean).join(', '),
    }));

    return {
      items: mapped,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getHomeSections(citySlug: string, limitPerDistrict = 4) {
    // 1) Thành phố (chú ý level tùy theo bạn định nghĩa: 'Province'/'City')
    const city = await this.locRepo.findOne({
      where: { slug: citySlug, level: 'Province' as any },
    });
    if (!city) throw new NotFoundException('Không tìm thấy thành phố');

    // 2) Danh sách quận/huyện
    const districts = await this.locRepo.find({
      where: { parent: { id: city.id }, level: 'District' as any },
      order: { name: 'ASC' },
    });

    // 3) Cho mỗi quận lấy N căn hộ đã publish, mới nhất
    const sections = [];
    for (const district of districts) {
      const apartments = await this.repo.find({
        where: { location: { id: district.id }, status: 'published' },
        order: { createdAt: 'DESC' },
        take: limitPerDistrict,
      });
      if (apartments.length) {
        sections.push({
          district: { id: district.id, name: district.name, slug: district.slug },
          apartments,
        });
      }
    }

    return {
      city: { id: city.id, name: city.name, slug: city.slug },
      sections,
    };
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: { location: { parent: true } },
    });
    if (!item) throw new NotFoundException('Apartment not found');
    return item;
  }

  async findBySlug(slug: string) {
    const item = await this.repo.findOne({
      where: { slug },
      relations: { location: { parent: true } },
    });
    if (!item) throw new NotFoundException('Apartment not found');
    return item;
  }

  async update(id: number, dto: UpdateApartmentDto) {
    const current = await this.findOne(id);

    const nextSlug = dto.slug?.trim() ?? current.slug;
    if (nextSlug !== current.slug) await this.assertSlugUnique(nextSlug, id);

    if (dto.locationId != null) {
      current.location = await this.ensureLocation(dto.locationId);
    }

    // base fields
    current.title = dto.title ?? current.title;
    current.slug = nextSlug;
    if (dto.excerpt !== undefined) current.excerpt = dto.excerpt;
    current.description = dto.description ?? current.description;
    current.streetAddress = dto.streetAddress ?? current.streetAddress;

    // numeric/decimal as string
    if (dto.lat != null) current.lat = dto.lat;
    if (dto.lng != null) current.lng = dto.lng;
    if (dto.areaM2 != null) current.areaM2 = dto.areaM2;
    if (dto.rentPrice != null) current.rentPrice = dto.rentPrice;

    // ints / enums
    if (dto.bedrooms != null) current.bedrooms = dto.bedrooms;
    if (dto.bathrooms != null) current.bathrooms = dto.bathrooms;
    if (dto.currency != null) current.currency = dto.currency;
    if (dto.status != null) current.status = dto.status;

    // images
    if (dto.coverImageUrl !== undefined) current.coverImageUrl = dto.coverImageUrl;

    // fees
    if (dto.electricityPricePerKwh !== undefined) current.electricityPricePerKwh = dto.electricityPricePerKwh;
    if (dto.waterPricePerM3 !== undefined) current.waterPricePerM3 = dto.waterPricePerM3;
    if (dto.internetPricePerRoom !== undefined) current.internetPricePerRoom = dto.internetPricePerRoom;
    if (dto.commonServiceFeePerPerson !== undefined) current.commonServiceFeePerPerson = dto.commonServiceFeePerPerson;

    // furniture
    if (dto.hasAirConditioner !== undefined) current.hasAirConditioner = dto.hasAirConditioner;
    if (dto.hasWaterHeater !== undefined) current.hasWaterHeater = dto.hasWaterHeater;
    if (dto.hasKitchenCabinet !== undefined) current.hasKitchenCabinet = dto.hasKitchenCabinet;
    if (dto.hasWashingMachine !== undefined) current.hasWashingMachine = dto.hasWashingMachine;
    if (dto.hasWardrobe !== undefined) current.hasWardrobe = dto.hasWardrobe;

    // facilities
    if (dto.hasPrivateBathroom !== undefined) current.hasPrivateBathroom = dto.hasPrivateBathroom;
    if (dto.hasMezzanine !== undefined) current.hasMezzanine = dto.hasMezzanine;
    if (dto.noOwnerLiving !== undefined) current.noOwnerLiving = dto.noOwnerLiving;
    if (dto.flexibleHours !== undefined) current.flexibleHours = dto.flexibleHours;

    return this.repo.save(current);
  }

  async remove(id: number) {
    const existed = await this.repo.findOne({ where: { id } });
    if (!existed) throw new NotFoundException('Apartment not found');
    await this.repo.delete(id);
    return { success: true };
  }
}
