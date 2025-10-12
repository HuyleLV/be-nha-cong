// src/partners/partners.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Partners } from './entities/partners.entity';
import { CreatePartnerDto } from './dto/create-partner.dto';

type Role = 'landlord' | 'customer' | 'operator';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partners)
    private readonly repo: Repository<Partners>,
  ) {}

  async create(dto: CreatePartnerDto) {
    const lead = this.repo.create({ ...dto });
    return this.repo.save(lead);
  }

  async findAll(query?: {
    page?: number;
    limit?: number;
    role?: Role;
    q?: string; // search by name/email/phone
  }) {
    const page = Math.max(1, Number(query?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query?.limit || 20)));
    const skip = (page - 1) * limit;

    // Nếu không có q -> dùng findAndCount nhanh
    if (!query?.q) {
      const where: FindOptionsWhere<Partners>[] = [];
      if (query?.role) where.push({ role: query.role });

      const [items, total] = await this.repo.findAndCount({
        where: where.length ? where : undefined,
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      return { items, total, page, limit };
    }

    // Có q -> dùng queryBuilder cho search
    const qb = this.repo.createQueryBuilder('pl').orderBy('pl.createdAt', 'DESC');

    if (query?.role) {
      qb.andWhere('pl.role = :role', { role: query.role });
    }

    const kw = `%${query.q}%`;

    // Postgres: ILIKE; các DB khác fallback LIKE
    const driver = this.repo.manager.connection.options.type;
    const likeOp = driver === 'postgres' ? 'ILIKE' : 'LIKE';

    qb.andWhere(
      `(pl.fullName ${likeOp} :kw OR pl.email ${likeOp} :kw OR pl.phone ${likeOp} :kw)`,
      { kw },
    );

    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async findOneOrFail(id: number) {
    const found = await this.findOne(id);
    if (!found) throw new NotFoundException('Partner not found');
    return found;
  }

  // (Tuỳ chọn) Update cho PUT /partners/:id nếu cần
  async update(id: number, dto: Partial<CreatePartnerDto>) {
    const entity = await this.findOneOrFail(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: number) {
    const entity = await this.findOneOrFail(id);
    await this.repo.remove(entity);
  }
}