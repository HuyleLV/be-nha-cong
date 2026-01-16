import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advertisement, AdvertisementStatus } from './entities/advertisement.entity';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { QueryAdvertisementDto } from './dto/query-advertisement.dto';

@Injectable()
export class AdvertisementsService {
    constructor(
        @InjectRepository(Advertisement)
        private readonly repo: Repository<Advertisement>,
    ) { }

    async create(dto: CreateAdvertisementDto, userId?: number): Promise<Advertisement> {
        const entity = this.repo.create({
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            createdBy: userId ?? null,
        });
        return this.repo.save(entity);
    }

    async findAll(query: QueryAdvertisementDto, publicView = false) {
        const page = query.page ?? 1;
        const limit = Math.min(100, query.limit ?? 20);
        const skip = (page - 1) * limit;

        const qb = this.repo
            .createQueryBuilder('a')
            .orderBy('a.priority', 'DESC')
            .addOrderBy('a.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        // Public view: chỉ lấy active và trong khoảng thời gian
        if (publicView || query.activeOnly) {
            qb.where('a.status = :status', { status: 'active' });
            const now = new Date();
            qb.andWhere('(a.start_date IS NULL OR a.start_date <= :now)', { now });
            qb.andWhere('(a.end_date IS NULL OR a.end_date >= :now)', { now });
        } else {
            // Admin view: có thể filter theo status
            if (query.status) {
                qb.where('a.status = :status', { status: query.status });
            }
        }

        if (query.position) {
            qb.andWhere('a.position = :position', { position: query.position });
        }

        if (query.q) {
            qb.andWhere('a.title LIKE :q', { q: `%${query.q}%` });
        }

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: number): Promise<Advertisement> {
        const ad = await this.repo.findOne({ where: { id } });
        if (!ad) {
            throw new NotFoundException('Advertisement not found');
        }
        return ad;
    }

    async update(id: number, dto: UpdateAdvertisementDto): Promise<Advertisement> {
        const ad = await this.findOne(id);

        Object.assign(ad, {
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : ad.startDate,
            endDate: dto.endDate ? new Date(dto.endDate) : ad.endDate,
        });

        return this.repo.save(ad);
    }

    async remove(id: number): Promise<{ deleted: boolean }> {
        const ad = await this.findOne(id);
        await this.repo.remove(ad);
        return { deleted: true };
    }

    /**
     * Track click - tăng clickCount
     */
    async trackClick(id: number): Promise<Advertisement> {
        const ad = await this.findOne(id);
        ad.clickCount = (ad.clickCount || 0) + 1;
        return this.repo.save(ad);
    }

    /**
     * Track view - tăng viewCount
     */
    async trackView(id: number): Promise<Advertisement> {
        const ad = await this.findOne(id);
        ad.viewCount = (ad.viewCount || 0) + 1;
        return this.repo.save(ad);
    }

    /**
     * Update priority
     */
    async updatePriority(id: number, priority: number): Promise<Advertisement> {
        if (priority < 0) {
            throw new BadRequestException('Priority must be >= 0');
        }
        const ad = await this.findOne(id);
        ad.priority = priority;
        return this.repo.save(ad);
    }

    /**
     * Update status
     */
    async updateStatus(id: number, status: AdvertisementStatus): Promise<Advertisement> {
        const ad = await this.findOne(id);
        ad.status = status;
        return this.repo.save(ad);
    }
}
