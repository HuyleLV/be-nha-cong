import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ensureUniqueSlug } from '../../common/helpers/slug.helper';

@Injectable()
export class NewsService {
  constructor(@InjectRepository(News) private readonly repo: Repository<News>) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;

    const [items, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async create(dto: CreateNewsDto) {
    const slug = await ensureUniqueSlug(this.repo, dto.slug ?? dto.title);
    const entity = this.repo.create({ ...dto, slug });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateNewsDto) {
    const news = await this.repo.findOneBy({ id });
    if (!news) throw new NotFoundException('News not found');

    let newSlug = news.slug;
    if (dto.slug && dto.slug.trim()) {
      newSlug = await ensureUniqueSlug(this.repo, dto.slug, id);
    } else if (dto.title && dto.title !== news.title) {
      newSlug = await ensureUniqueSlug(this.repo, dto.title, id);
    }

    Object.assign(news, {
      title: dto.title ?? news.title,
      slug: newSlug,
      excerpt: dto.excerpt ?? news.excerpt,
      content: dto.content ?? news.content,
      coverImageUrl: dto.coverImageUrl ?? news.coverImageUrl,
      status: dto.status ?? news.status,
      isPinned: dto.isPinned ?? news.isPinned,
      tags: dto.tags ?? news.tags,
      viewCount: dto.viewCount ?? news.viewCount,
      pointSeo: dto.pointSeo ?? news.pointSeo,
      focusKeyword: dto.focusKeyword ?? news.focusKeyword,
      authorId: dto.authorId ?? news.authorId,
    });

    return this.repo.save(news);
  }

  async remove(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('News not found');
    await this.repo.remove(item);
    return { deleted: true };
  }
}
