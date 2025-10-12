// src/apartments/apartments.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, ILike, Repository } from 'typeorm';
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
    if (existed && existed.id !== excludeId) throw new BadRequestException('Slug already exists');
  }

  async create(dto: CreateApartmentDto, userIdFromReq?: number) {
    const slug = dto.slug?.trim() || makeSlug(dto.title);
    if (!slug) throw new BadRequestException('Invalid slug');
    await this.assertSlugUnique(slug);

    const location = await this.ensureLocation(dto.locationId);

    const createdById = userIdFromReq;
    if (!createdById) throw new BadRequestException('createdById is required');

    const entity = this.repo.create({
      title: dto.title,
      slug,
      excerpt: dto.excerpt,              // 👈 set mô tả ngắn
      description: dto.description,
      location,
      streetAddress: dto.streetAddress,
      lat: dto.lat?.toString(),
      lng: dto.lng?.toString(),
      bedrooms: dto.bedrooms ?? 0,
      bathrooms: dto.bathrooms ?? 0,
      areaM2: dto.areaM2?.toString(),
      rentPrice: dto.rentPrice.toString(),
      currency: dto.currency ?? 'VND',
      status: dto.status ?? 'draft',
      coverImageUrl: dto.coverImageUrl,
      createdById,                       // 👈 set người tạo
    });

    return this.repo.save(entity);
  }

  async findAll(q: QueryApartmentDto) {
    const page  = Number(q.page)  || 1;
    const limit = Number(q.limit) || 20;
  
    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.location', 'l')
      .leftJoinAndSelect('l.parent', 'p') // nếu cần tỉnh/thành
      .orderBy('a.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);
  
    // by location
    if (q.locationId)   qb.andWhere('l.id = :lid',        { lid: q.locationId });
    if (q.locationSlug) qb.andWhere('l.slug = :lslug',    { lslug: q.locationSlug });
  
    // status
    if (q.status) qb.andWhere('a.status = :st', { st: q.status });
  
    // text search (compat MySQL/Postgres): LOWER(...) LIKE :kw
    if (q.q) {
      const kw = `%${q.q.toLowerCase()}%`;
      qb.andWhere(new Brackets((w) => {
        w.where('LOWER(a.title) LIKE :kw', { kw })
         .orWhere('LOWER(l.name) LIKE :kw', { kw })
         .orWhere('LOWER(p.name) LIKE :kw', { kw });
        // Nếu muốn bỏ qua dấu hoàn toàn trên MariaDB, có thể dùng:
        // w.where('a.title COLLATE utf8mb4_unicode_ci LIKE :kw', { kw })
      }));
    }
  
    // numeric filters
    if (q.bedrooms  != null) qb.andWhere('a.bedrooms  >= :bed',  { bed: q.bedrooms });
    if (q.bathrooms != null) qb.andWhere('a.bathrooms >= :bath', { bath: q.bathrooms });
    if (q.minPrice  != null) qb.andWhere('a.rentPrice >= :minp', { minp: q.minPrice });
    if (q.maxPrice  != null) qb.andWhere('a.rentPrice <= :maxp', { maxp: q.maxPrice });
  
    const [data, total] = await qb.getManyAndCount();
  
    // (tuỳ chọn) build addressPath
    const mapped = data.map((apt) => ({
      ...apt,
      addressPath: [apt.location?.name, apt.location?.parent?.name].filter(Boolean).join(', '),
    }));
  
    return {
      data: mapped,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getHomeSections(citySlug: string, limitPerDistrict = 4) {
    // 1️⃣ Tìm thành phố
    const city = await this.locRepo.findOne({
      where: { slug: citySlug, level: 'Province' },
    });
    if (!city) throw new NotFoundException('Không tìm thấy thành phố');

    // 2️⃣ Lấy danh sách quận/huyện trong city
    const districts = await this.locRepo.find({
      where: { parent: { id: city.id }, level: 'District' },
      order: { name: 'ASC' },
    });

    // 3️⃣ Cho mỗi quận lấy ra N căn hộ mới nhất (đã publish)
    const results = [];
    for (const district of districts) {
      const apartments = await this.repo.find({
        where: {
          location: { id: district.id },
          status: 'published',
        },
        order: { createdAt: 'DESC' },
        take: limitPerDistrict,
      });

      if (apartments.length > 0) {
        results.push({
          district: {
            id: district.id,
            name: district.name,
            slug: district.slug,
          },
          apartments,
        });
      }
    }

    return {
      city: { id: city.id, name: city.name, slug: city.slug },
      sections: results,
    };
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id }, relations: { location: true } });
    if (!item) throw new NotFoundException('Apartment not found');
    return item;
  }

  async findBySlug(slug: string) {
    const item = await this.repo.findOne({ where: { slug }, relations: { location: true } });
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

    current.title = dto.title ?? current.title;
    current.slug = nextSlug;

    // 👇 cho phép cập nhật mô tả ngắn + mô tả dài
    if (dto.excerpt !== undefined) current.excerpt = dto.excerpt;
    current.description = dto.description ?? current.description;

    current.streetAddress = dto.streetAddress ?? current.streetAddress;

    if (dto.lat != null) current.lat = dto.lat.toString();
    if (dto.lng != null) current.lng = dto.lng.toString();
    if (dto.areaM2 != null) current.areaM2 = dto.areaM2.toString();
    if (dto.rentPrice != null) current.rentPrice = dto.rentPrice.toString();

    if (dto.bedrooms != null) current.bedrooms = dto.bedrooms;
    if (dto.bathrooms != null) current.bathrooms = dto.bathrooms;

    if (dto.currency != null) current.currency = dto.currency;
    if (dto.status != null) current.status = dto.status;
    if (dto.coverImageUrl !== undefined) current.coverImageUrl = dto.coverImageUrl;

    return this.repo.save(current);
  }

  async remove(id: number) {
    const existed = await this.repo.findOne({ where: { id } });
    if (!existed) throw new NotFoundException('Apartment not found');
    await this.repo.delete(id);
    return { success: true };
  }
}