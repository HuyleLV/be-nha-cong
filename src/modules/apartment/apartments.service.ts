// src/apartments/apartments.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
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
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
  
    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.location', 'l') // ✅ nối bảng locations
      .leftJoinAndSelect('l.parent', 'p')   // (tuỳ chọn) nối thêm cha để lấy tên tỉnh/thành
      .orderBy('a.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);
  
    // ✅ lọc theo location
    if (q.locationId) qb.andWhere('l.id = :lid', { lid: q.locationId });
    if (q.locationSlug) qb.andWhere('l.slug = :lslug', { lslug: q.locationSlug });
  
    // lọc khác
    if (q.status) qb.andWhere('a.status = :st', { st: q.status });
    if (q.q) qb.andWhere('a.title ILIKE :kw', { kw: `%${q.q}%` });
    if (q.bedrooms != null) qb.andWhere('a.bedrooms >= :bed', { bed: q.bedrooms });
    if (q.bathrooms != null) qb.andWhere('a.bathrooms >= :bath', { bath: q.bathrooms });
    if (q.minPrice != null) qb.andWhere('a.rentPrice >= :minp', { minp: q.minPrice });
    if (q.maxPrice != null) qb.andWhere('a.rentPrice <= :maxp', { maxp: q.maxPrice });
  
    const [data, total] = await qb.getManyAndCount();
  
    // (tuỳ chọn) build addressPath nếu cần
    const mapped = data.map((apt) => ({
      ...apt,
      addressPath: [
        apt.location?.name,        
        apt.location?.parent?.name, 
      ].filter(Boolean).join(', '),
    }));
  
    return {
      data: mapped,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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