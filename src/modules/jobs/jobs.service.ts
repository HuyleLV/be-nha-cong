import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobApplication } from './entities/job-application.entity';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';

const toSlug = (s: string) => (s||'')
  .normalize('NFD').replace(/\p{Diacritic}/gu,'')
  .toLowerCase().replace(/[^a-z0-9\s-]/g,'')
  .trim().replace(/\s+/g,'-').replace(/-+/g,'-');

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly repo: Repository<Job>,
    @InjectRepository(JobApplication) private readonly appRepo: Repository<JobApplication>,
  ) {}

  private async ensureUniqueSlug(base: string, excludeId?: number) {
    let slug = toSlug(base);
    if (!slug) throw new BadRequestException('Invalid slug');
    let i=1;
    while (await this.repo.findOne({ where: { slug } })) slug = `${base}-${i++}`;
    return slug;
  }

  async create(dto: CreateJobDto) {
    const slug = await this.ensureUniqueSlug(dto.slug || dto.title);
    const entity = this.repo.create({
      ...dto,
      slug,
      status: dto.status ?? 'draft',
      publishedAt: dto.status === 'published' ? new Date() : null,
    });
    return this.repo.save(entity);
  }

  async findAll(params?: { page?: number; limit?: number; q?: string; status?: string }) {
    const page = params?.page ?? 1;
    const limit = Math.min(100, params?.limit ?? 20);
    const qb = this.repo.createQueryBuilder('j')
      .orderBy('j.createdAt','DESC')
      .take(limit)
      .skip((page-1)*limit);
    if (params?.q) {
      const kw = `%${params.q.toLowerCase()}%`;
      qb.andWhere('(LOWER(j.title) LIKE :kw OR LOWER(j.location) LIKE :kw)', { kw });
    }
    if (params?.status) qb.andWhere('j.status = :st', { st: params.status });
  const [items,total] = await qb.getManyAndCount();
  return { items, meta: { total, page, limit, totalPages: Math.ceil(total/limit) } };
  }

  async findOne(idOrSlug: number | string) {
    const where = typeof idOrSlug === 'number' ? { id: idOrSlug } : { slug: String(idOrSlug) };
    const job = await this.repo.findOne({ where });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async update(id: number, dto: UpdateJobDto) {
    const job = await this.repo.findOne({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    if (dto.title && dto.title !== job.title) {
      job.slug = await this.ensureUniqueSlug(dto.slug || dto.title);
    } else if (dto.slug && dto.slug !== job.slug) {
      job.slug = await this.ensureUniqueSlug(dto.slug);
    }
    Object.assign(job, dto);
    if (dto.status && dto.status === 'published' && !job.publishedAt) job.publishedAt = new Date();
    if (dto.status && dto.status !== 'published') job.publishedAt = null;
    return this.repo.save(job);
  }

  async remove(id: number) {
    const ok = await this.repo.findOne({ where: { id } });
    if (!ok) throw new NotFoundException('Job not found');
    await this.repo.delete(id);
    return { success: true };
  }

  // ===== Applications =====
  async createApplication(idOrSlug: number | string, body: Omit<CreateJobApplicationDto, 'jobId'>) {
    const job = await this.findOne(idOrSlug);
    const app = this.appRepo.create({
      jobId: job.id,
      name: (body.name || '').trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      cvUrl: body.cvUrl?.trim() || null,
      message: body.message || null,
    });
    if (!app.name) throw new BadRequestException('Name is required');
    return this.appRepo.save(app);
  }
}
