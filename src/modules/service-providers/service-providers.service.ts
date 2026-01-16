import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    ServiceProvider,
    ServiceProviderStatus,
} from './entities/service-provider.entity';
import { CreateServiceProviderDto } from './dto/create-service-provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service-provider.dto';
import { QueryServiceProviderDto } from './dto/query-service-provider.dto';
import { ensureUniqueSlug } from '../../common/helpers/slug.helper';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ServiceProvidersService {
    constructor(
        @InjectRepository(ServiceProvider)
        private readonly repo: Repository<ServiceProvider>,
    ) { }

    async create(
        dto: CreateServiceProviderDto,
        createdBy?: number,
        userRole?: string,
    ): Promise<ServiceProvider> {
        // Check if phone already exists
        const existing = await this.repo.findOne({
            where: { phone: dto.phone },
        });

        if (existing) {
            throw new BadRequestException('Số điện thoại đã được sử dụng');
        }

        // Logic kiểm duyệt: customer → pending + not verified, admin/host → active + verified
        let status = dto.status ?? ServiceProviderStatus.ACTIVE;
        let isVerified = dto.isVerified ?? false;
        let approvalStatus:
            | 'pending'
            | 'approved'
            | 'rejected'
            | 'under_review'
            | 'needs_revision'
            | null = dto.approvalStatus ?? null;
        let isApproved = false;

        if (userRole && userRole.toLowerCase() === 'customer') {
            status = ServiceProviderStatus.PENDING;
            isVerified = false;
            if (!approvalStatus) approvalStatus = 'pending';
        } else if (
            userRole &&
            (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'host')
        ) {
            status = ServiceProviderStatus.ACTIVE;
            isVerified = true;
            if (!approvalStatus) approvalStatus = 'approved';
            isApproved = true;
        }

        // Nếu approvalStatus = 'approved', tự động set isApproved = true và status = 'active'
        if (approvalStatus === 'approved') {
            isApproved = true;
            status = ServiceProviderStatus.ACTIVE;
            isVerified = true;
        }

        // Generate slug from name
        const slugBase = dto.slug || dto.name;
        const slug = await ensureUniqueSlug(this.repo, slugBase);

        const provider = this.repo.create({
            ...dto,
            slug,
            rating: dto.rating ? dto.rating.toString() : null,
            priceFrom: dto.priceFrom || null,
            priceTo: dto.priceTo || null,
            createdBy: createdBy || null,
            status,
            isVerified,
            approvalStatus: approvalStatus ?? null,
            priority: dto.priority ?? 0,
            approvalNote: dto.approvalNote ?? null,
            isApproved,
        });

        const saved = await this.repo.save(provider);
        return (Array.isArray(saved) ? saved[0] : saved) as ServiceProvider;
    }

    async findAll(query: QueryServiceProviderDto, user?: Partial<User>) {
        const page = Math.max(1, Number(query?.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
        const skip = (page - 1) * limit;

        const qb = this.repo
            .createQueryBuilder('sp')
            .orderBy('sp.rating', 'DESC')
            .addOrderBy('sp.reviews', 'DESC')
            .skip(skip)
            .take(limit);

        // Public visibility: chỉ hiển thị active và verified (trừ admin và owner)
        if (!user || user.role !== 'admin') {
            qb.where('sp.status = :status', {
                status: ServiceProviderStatus.ACTIVE,
            }).andWhere('sp.is_verified = :verified', { verified: true });
        } else {
            // Admin có thể xem tất cả, nhưng mặc định vẫn filter active
            if (!query.status) {
                qb.where('sp.status = :status', {
                    status: ServiceProviderStatus.ACTIVE,
                });
            } else {
                qb.where('sp.status = :status', { status: query.status });
            }
        }

        if (query.q) {
            qb.andWhere(
                '(sp.name LIKE :q OR sp.description LIKE :q OR sp.address LIKE :q)',
                { q: `%${query.q}%` },
            );
        }

        if (query.serviceType) {
            qb.andWhere('sp.service_type = :serviceType', {
                serviceType: query.serviceType,
            });
        }

        if (query.locationId) {
            qb.andWhere('sp.location_id = :locationId', {
                locationId: query.locationId,
            });
        }

        if (query.locationIds && query.locationIds.length > 0) {
            qb.andWhere('sp.location_id IN (:...locationIds)', {
                locationIds: query.locationIds,
            });
        }

        if (query.minRating) {
            qb.andWhere('sp.rating >= :minRating', {
                minRating: query.minRating.toString(),
            });
        }

        if (query.isVerified !== undefined) {
            qb.andWhere('sp.is_verified = :isVerified', {
                isVerified: query.isVerified,
            });
        }

        // Filter by approvalStatus if provided
        if (query.approvalStatus) {
            const approvalStatus = query.approvalStatus;
            if (approvalStatus === 'null' || approvalStatus === '') {
                qb.andWhere('sp.approval_status IS NULL');
            } else {
                qb.andWhere('sp.approval_status = :approvalStatus', { approvalStatus });
            }
        }

        // Filter by priority if provided
        if (query.priority != null) {
            qb.andWhere('sp.priority = :priority', { priority: query.priority });
        }

        if (query.minPrice != null) {
            qb.andWhere('(sp.price_from <= :minPrice OR sp.price_to >= :minPrice)', {
                minPrice: query.minPrice.toString(),
            });
        }

        if (query.maxPrice != null) {
            qb.andWhere('(sp.price_from <= :maxPrice OR sp.price_to <= :maxPrice)', {
                maxPrice: query.maxPrice.toString(),
            });
        }

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(
        idOrSlug: number | string,
        user?: Partial<User>,
    ): Promise<ServiceProvider> {
        const where =
            typeof idOrSlug === 'number'
                ? { id: idOrSlug }
                : { slug: String(idOrSlug) };
        const provider = await this.repo.findOne({ where });

        if (!provider) {
            throw new NotFoundException('Service provider not found');
        }

        // Public visibility: chỉ hiển thị active và verified (trừ admin)
        if (!user || user.role !== 'admin') {
            if (
                provider.status !== ServiceProviderStatus.ACTIVE ||
                !provider.isVerified
            ) {
                throw new NotFoundException('Service provider not found');
            }
        }

        return provider;
    }

    async update(
        id: number,
        dto: UpdateServiceProviderDto,
        userId?: number,
        userRole?: string,
    ): Promise<ServiceProvider> {
        const provider = await this.repo.findOne({ where: { id } });
        if (!provider) {
            throw new NotFoundException('Service provider not found');
        }

        // Update slug if name changed
        if (dto.slug !== undefined || dto.name !== undefined) {
            const slugBase = dto.slug || dto.name || provider.name;
            provider.slug = await ensureUniqueSlug(this.repo, slugBase, id);
        }

        // Kiểm tra quyền: customer chỉ có thể sửa của chính mình
        if (userRole && userRole.toLowerCase() === 'customer') {
            if (provider.createdBy !== userId) {
                throw new BadRequestException(
                    'Bạn chỉ có thể sửa dịch vụ của chính mình',
                );
            }
            // Customer không thể tự verify hoặc set status = active
            if (dto.isVerified === true || dto.status === ServiceProviderStatus.ACTIVE) {
                throw new BadRequestException(
                    'Bạn không thể tự verify hoặc active dịch vụ. Vui lòng chờ admin duyệt.',
                );
            }
        }

        // Check phone uniqueness if phone is being updated
        if (dto.phone && dto.phone !== provider.phone) {
            const existing = await this.repo.findOne({
                where: { phone: dto.phone },
            });

            if (existing) {
                throw new BadRequestException('Số điện thoại đã được sử dụng');
            }
        }

        // Update approval workflow fields
        if (dto.approvalStatus !== undefined) {
            provider.approvalStatus = dto.approvalStatus;
            // Nếu approved, tự động set isApproved = true, status = active, isVerified = true
            if (dto.approvalStatus === 'approved') {
                provider.isApproved = true;
                provider.status = ServiceProviderStatus.ACTIVE;
                provider.isVerified = true;
            } else if (
                dto.approvalStatus === 'rejected' ||
                dto.approvalStatus === 'needs_revision'
            ) {
                provider.isApproved = false;
            }
        }
        if (dto.priority !== undefined) {
            provider.priority = dto.priority;
        }
        if (dto.approvalNote !== undefined) {
            provider.approvalNote = dto.approvalNote;
        }

        Object.assign(provider, {
            ...dto,
            rating: dto.rating ? dto.rating.toString() : provider.rating,
        });

        // Nếu admin approve, set status = active và isVerified = true
        if (
            userRole &&
            (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'host')
        ) {
            if (dto.status === ServiceProviderStatus.ACTIVE) {
                provider.isVerified = true;
                // Nếu chưa có approvalStatus, tự động set approved
                if (!provider.approvalStatus) {
                    provider.approvalStatus = 'approved';
                    provider.isApproved = true;
                }
            }
        }

        return this.repo.save(provider);
    }

    async remove(
        id: number,
        userId?: number,
        userRole?: string,
    ): Promise<{ deleted: boolean }> {
        const provider = await this.findOne(id);

        // Kiểm tra quyền: customer chỉ có thể xóa của chính mình
        if (userRole && userRole.toLowerCase() === 'customer') {
            if (provider.createdBy !== userId) {
                throw new BadRequestException(
                    'Bạn chỉ có thể xóa dịch vụ của chính mình',
                );
            }
        }

        await this.repo.remove(provider);
        return { deleted: true };
    }

    /**
     * Update rating and reviews count
     */
    async updateRating(id: number, newRating: number): Promise<ServiceProvider> {
        const provider = await this.findOne(id);

        // Calculate new average rating
        const currentRating = parseFloat(provider.rating || '0');
        const currentReviews = provider.reviews || 0;
        const totalRating = currentRating * currentReviews + newRating;
        const newReviews = currentReviews + 1;
        const averageRating = totalRating / newReviews;

        provider.rating = averageRating.toFixed(2);
        provider.reviews = newReviews;

        return this.repo.save(provider);
    }
}
