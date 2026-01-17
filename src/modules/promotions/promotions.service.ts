import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, And } from 'typeorm';
import { Promotion } from './entities/promotion.entity';

@Injectable()
export class PromotionsService {
    constructor(
        @InjectRepository(Promotion) private readonly repo: Repository<Promotion>,
    ) { }

    async create(data: Partial<Promotion>, userId?: number) {
        const exists = await this.repo.findOne({ where: { code: data.code } });
        if (exists) throw new BadRequestException('Mã khuyến mãi đã tồn tại');

        const promo = this.repo.create({ ...data, createdBy: userId });
        return this.repo.save(promo);
    }

    async findAll(activeOnly: boolean = false) {
        const where: any = {};
        if (activeOnly) {
            where.active = true;
            // also check dates
            const now = new Date();
            // TypeORM date comparison can be tricky, doing simple active check for list
            // For proper check see checkValidity
        }
        return this.repo.find({ where, order: { createdAt: 'DESC' } });
    }

    async findOne(id: number) {
        return this.repo.findOne({ where: { id } });
    }

    async checkValidity(code: string) {
        const promo = await this.repo.findOne({ where: { code, active: true } });
        if (!promo) throw new NotFoundException('Mã khuyến mãi không tồn tại hoặc đã hết hạn');

        const now = new Date();
        if (promo.startDate && promo.startDate > now) throw new BadRequestException('Mã khuyến mãi chưa có hiệu lực');
        if (promo.endDate && promo.endDate < now) throw new BadRequestException('Mã khuyến mãi đã hết hạn');
        if (promo.maxUses && promo.usedCount >= promo.maxUses) throw new BadRequestException('Mã khuyến mãi đã hết lượt sử dụng');

        return promo;
    }

    async useCode(code: string) {
        const promo = await this.checkValidity(code);
        promo.usedCount += 1;
        await this.repo.save(promo);
        return promo;
    }
}
