import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ensureUniqueSlug } from '../../common/helpers/slug.helper'

@Injectable()
export class BlogService {
    constructor(@InjectRepository(Blog) private readonly repo: Repository<Blog>) {}

    async findAll(query: PaginationQueryDto) {
        const { page = 1, limit = 10 } = query;

        const [items, total] = await this.repo.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                pageCount: Math.ceil(total / limit)
            },
        };
    }

    async findBySlug(slug: string) {
        return this.repo.findOne({
          where: { slug },
        });
    }

    findOne(id: number) {
        return this.repo.findOneBy({ id });
    }

    async create(dto: CreateBlogDto) {
        const slug = await ensureUniqueSlug(this.repo, dto.slug ?? dto.title);
    
        const entity = this.repo.create({
            ...dto,
            slug,
        });
        return this.repo.save(entity);
    }


    async update(id: number, dto: UpdateBlogDto) {
        const blog = await this.repo.findOneBy({ id });
        if (!blog) throw new NotFoundException('Blog not found');
      
        let newSlug = blog.slug;
      
        if (dto.slug && dto.slug.trim()) {
          newSlug = await ensureUniqueSlug(this.repo, dto.slug, id);
        } else if (dto.title && dto.title !== blog.title) {
          newSlug = await ensureUniqueSlug(this.repo, dto.title, id);
        }
      
        Object.assign(blog, {
          title: dto.title ?? blog.title,
          slug: newSlug,
          excerpt: dto.excerpt ?? blog.excerpt,
          content: dto.content ?? blog.content,
          coverImageUrl: dto.coverImageUrl ?? blog.coverImageUrl,
          status: dto.status ?? blog.status,
          isPinned: dto.isPinned ?? blog.isPinned,
          tags: dto.tags ?? blog.tags,
          viewCount: dto.viewCount ?? blog.viewCount,
          authorId: dto.authorId ?? blog.authorId,
        });
      
        return this.repo.save(blog);
      }

    async remove(id: number) {
        const user = await this.repo.findOneBy({ id });
        if (!user) throw new NotFoundException('User not found');
        await this.repo.remove(user);
        return { deleted: true };
    }
}
