import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

// Slug helper
const toSlug = (s: string) =>
    s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly repo: Repository<Category>,
    ) { }

    async create(dto: CreateCategoryDto) {
        const slug = dto.slug || toSlug(dto.name);
        // Ensure unique slug
        let finalSlug = slug;
        let i = 1;
        while (await this.repo.findOne({ where: { slug: finalSlug } as any })) {
            finalSlug = `${slug}-${i++}`;
        }

        const entity = this.repo.create({
            ...dto,
            slug: finalSlug,
        });
        return this.repo.save(entity);
    }

    async findAll(type?: CategoryType) {
        const q = this.repo.createQueryBuilder('c').orderBy('c.id', 'DESC');
        if (type) {
            q.where('c.type = :type', { type });
        }
        return q.getMany();
    }

    async findOne(id: number) {
        const item = await this.repo.findOne({ where: { id } as any });
        if (!item) throw new NotFoundException('Category not found');
        return item;
    }

    async update(id: number, dto: Partial<CreateCategoryDto>) {
        const item = await this.findOne(id);
        if (dto.name && !dto.slug) {
            // Only update slug if name changes and slug wasn't provided? 
            // For now keep slug stable unless explicitly changed or we want auto-update
        }
        Object.assign(item, dto);
        return this.repo.save(item);
    }

    async remove(id: number) {
        const item = await this.findOne(id);
        return this.repo.remove(item);
    }
}
