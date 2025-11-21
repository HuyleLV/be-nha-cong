// src/locations/locations.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Location } from './entities/locations.entity'; 
import { Building } from 'src/modules/building/entities/building.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';
import { makeSlug } from 'src/common/helpers/slug.helper';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private readonly repo: Repository<Location>,
    @InjectRepository(Building) private readonly buildingRepo: Repository<Building>,
  ) {}

  async findAll(q: QueryLocationDto, user?: any) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const where: any = {};
    if (q.level) where.level = q.level;
    if (typeof q.parentId !== 'undefined') {
      where.parent = q.parentId ? { id: q.parentId } : null;
    }
    if (q.q) {
      // tìm theo name (không đụng đến slug ở đây, bạn có thể thêm OR slug ILike)
      where.name = ILike(`%${q.q}%`);
    }

    // If requesting Street level and caller is a host, only return streets created by that host
    if (q.level === 'Street' && user && (user.role === 'host' || user.role === 'chu_nha' || user.role === 'owner')) {
      // support different payload keys for role if needed
      where.createdBy = user.id ?? user.sub;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: { parent: true },
      order: { level: 'ASC', name: 'ASC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    // If requesting Street level, augment each location with buildingCount (owner-scoped for hosts)
    let itemsWithCounts: any[] = data as any[];
    if (q.level === 'Street') {
      const locIds = (data as any[]).map((d) => d.id).filter(Boolean);
      if (locIds.length) {
        const qb = this.buildingRepo.createQueryBuilder('b')
          .select('b.location_id', 'locationId')
          .addSelect('COUNT(1)', 'cnt')
          .where('b.location_id IN (:...ids)', { ids: locIds });
        if (user && (user.role === 'host' || user.role === 'chu_nha' || user.role === 'owner')) {
          qb.andWhere('b.created_by = :uid', { uid: user.id ?? user.sub });
        }
        const rows = await qb.groupBy('b.location_id').getRawMany();
        const counts: Record<number, number> = {};
        rows.forEach((r: any) => { counts[Number(r.locationId)] = Number(r.cnt); });
        itemsWithCounts = (data as any[]).map((d) => ({ ...d, buildingCount: counts[d.id] ?? 0 }));
      } else {
        itemsWithCounts = (data as any[]).map((d) => ({ ...d, buildingCount: 0 }));
      }
    }

    return {
      data: itemsWithCounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, user?: any) {
    const item = await this.repo.findOne({
      where: { id },
      relations: { parent: true },
    });
    if (!item) throw new NotFoundException('Location not found');

    // If this is a Street, restrict non-admin viewers to the owner
    if ((item as any).level === 'Street' && user && !(user.role === 'admin' || user.role === 'Admin')) {
      const ownerId = (item as any).createdBy;
      const uid = user.id ?? user.sub ?? null;
        if (typeof ownerId !== 'undefined' && ownerId !== null && String(ownerId) !== String(uid)) {
        throw new ForbiddenException('Không có quyền xem địa điểm này');
      }
    }

    return item;
  }

  async findBySlug(slug: string, user?: any) {
    const item = await this.repo.findOne({
      where: { slug },
      relations: { parent: true },
    });
    if (!item) throw new NotFoundException('Location not found');

    if ((item as any).level === 'Street' && user && !(user.role === 'admin' || user.role === 'Admin')) {
      const ownerId = (item as any).createdBy;
      const uid = user.id ?? user.sub ?? null;
        if (typeof ownerId !== 'undefined' && ownerId !== null && String(ownerId) !== String(uid)) {
        throw new ForbiddenException('Không có quyền xem địa điểm này');
      }
    }

    return item;
  }

  private async ensureParent(parentId?: number | null) {
    if (parentId == null) return null;
    const parent = await this.repo.findOne({ where: { id: parentId } });
    if (!parent) throw new BadRequestException('Parent not found');
    return parent;
  }

  private validateHierarchy(level: string, parent: Location | null) {
    if (!parent) {
      if (level === 'City' || level === 'District') {
        throw new BadRequestException(`${level} requires a parent`);
      }
      return;
    }
    if (level === 'City' && parent.level !== 'Province') {
      throw new BadRequestException('City parent must be a Province');
    }
    if (level === 'District' && parent.level !== 'City') {
      throw new BadRequestException('District parent must be a City');
    }
    if (level === 'Street' && parent.level !== 'District') {
      throw new BadRequestException('Street parent must be a District');
    }
    if (level === 'Province' && parent) {
      throw new BadRequestException('Province cannot have a parent');
    }
  }

  private async assertSlugUnique(slug: string, excludeId?: number) {
    const existed = await this.repo.findOne({ where: { slug } });
    if (existed && existed.id !== excludeId) {
      throw new BadRequestException('Slug already exists');
    }
  }

  async create(dto: CreateLocationDto, userId?: number) {
    const slug = dto.slug?.trim() || makeSlug(dto.name);
    if (!slug) throw new BadRequestException('Invalid slug');
    await this.assertSlugUnique(slug);

    const parent = await this.ensureParent(dto.parentId ?? null);
    this.validateHierarchy(dto.level, parent);

    const entity = this.repo.create({
      name: dto.name,
      slug,
      level: dto.level,
      coverImageUrl: dto.coverImageUrl,
      parent,
    });

    // If creating a Street, associate it with the creating user when provided
    if (dto.level === 'Street' && typeof userId !== 'undefined') {
      // createdBy column is numeric
      (entity as any).createdBy = userId;
    }

    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateLocationDto, userId?: number, userRole?: string) {
    const current = await this.findOne(id);

    // Only allow non-admin users to update streets they created
    if (current.level === 'Street' && userRole !== 'admin') {
      const ownerId = (current as any).createdBy;
        if (typeof ownerId !== 'undefined' && ownerId !== null && String(ownerId) !== String(userId)) {
        throw new ForbiddenException('Không có quyền chỉnh sửa đường này');
      }
    }

    // nếu slug đổi → check unique
    const nextSlug = dto.slug?.trim() ?? current.slug;
    if (nextSlug !== current.slug) {
      await this.assertSlugUnique(nextSlug, id);
    }

    current.name = dto.name ?? current.name;
    current.slug = nextSlug;
    current.level = dto.level ?? current.level;
    current.coverImageUrl = typeof dto.coverImageUrl !== 'undefined'
      ? dto.coverImageUrl
      : current.coverImageUrl;

    if (typeof dto.parentId !== 'undefined') {
      if (dto.parentId === null) {
        current.parent = null;
      } else {
        if (dto.parentId === id) {
          throw new BadRequestException('parentId cannot be the same as current node');
        }
        const nextParent = await this.ensureParent(dto.parentId);
        this.validateHierarchy(current.level, nextParent);
        current.parent = nextParent;
      }
    } else {
      // Even if parentId not provided, ensure existing parent still valid after potential level change
      this.validateHierarchy(current.level, current.parent ?? null);
    }

    return this.repo.save(current);
  }

  async remove(id: number, userId?: number, userRole?: string) {
    const existed = await this.repo.findOne({ where: { id } });
    if (!existed) throw new NotFoundException('Location not found');

    // If deleting a Street, only allow admin or owner
    if ((existed as any).level === 'Street' && userRole !== 'admin') {
      const ownerId = (existed as any).createdBy;
        if (typeof ownerId !== 'undefined' && ownerId !== null && String(ownerId) !== String(userId)) {
        throw new ForbiddenException('Không có quyền xóa đường này');
      }
    }

    // Lưu ý: do quan hệ con → cha có onDelete: CASCADE, xoá cha sẽ kéo xoá con
    await this.repo.delete(id);
    return { success: true };
  }
}