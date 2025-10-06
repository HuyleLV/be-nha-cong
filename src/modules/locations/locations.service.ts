// src/locations/locations.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Location } from './entities/locations.entity'; 
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';
import { makeSlug } from 'src/common/helpers/slug.helper';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location) private readonly repo: Repository<Location>,
  ) {}

  async findAll(q: QueryLocationDto) {
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

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: { parent: true },
      order: { level: 'ASC', name: 'ASC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: { parent: true },
    });
    if (!item) throw new NotFoundException('Location not found');
    return item;
  }

  async findBySlug(slug: string) {
    const item = await this.repo.findOne({
      where: { slug },
      relations: { parent: true },
    });
    if (!item) throw new NotFoundException('Location not found');
    return item;
  }

  private async ensureParent(parentId?: number | null) {
    if (parentId == null) return null;
    const parent = await this.repo.findOne({ where: { id: parentId } });
    if (!parent) throw new BadRequestException('Parent not found');
    return parent;
  }

  private async assertSlugUnique(slug: string, excludeId?: number) {
    const existed = await this.repo.findOne({ where: { slug } });
    if (existed && existed.id !== excludeId) {
      throw new BadRequestException('Slug already exists');
    }
  }

  async create(dto: CreateLocationDto) {
    const slug = dto.slug?.trim() || makeSlug(dto.name);
    if (!slug) throw new BadRequestException('Invalid slug');
    await this.assertSlugUnique(slug);

    const entity = this.repo.create({
      name: dto.name,
      slug,
      level: dto.level,
      coverImageUrl: dto.coverImageUrl,
    });

    entity.parent = await this.ensureParent(dto.parentId ?? null);

    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateLocationDto) {
    const current = await this.findOne(id);

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
        // chặn tự nhận mình làm con của chính mình
        if (dto.parentId === id) {
          throw new BadRequestException('parentId cannot be the same as current node');
        }
        current.parent = await this.ensureParent(dto.parentId);
      }
    }

    return this.repo.save(current);
  }

  async remove(id: number) {
    const existed = await this.repo.findOne({ where: { id } });
    if (!existed) throw new NotFoundException('Location not found');
    // Lưu ý: do quan hệ con → cha có onDelete: CASCADE, xoá cha sẽ kéo xoá con
    await this.repo.delete(id);
    return { success: true };
  }
}