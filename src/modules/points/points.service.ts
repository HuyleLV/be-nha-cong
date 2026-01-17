import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointTransaction } from './entities/point-transaction.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PointsService {
    constructor(
        @InjectRepository(PointTransaction) private readonly repo: Repository<PointTransaction>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) { }

    async getBalance(userId: number): Promise<number> {
        const { sum } = await this.repo
            .createQueryBuilder('pt')
            .select('SUM(pt.amount)', 'sum')
            .where('pt.user_id = :userId', { userId })
            .getRawOne();
        return Number(sum || 0);
    }

    async getHistory(userId: number, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;
        const [items, total] = await this.repo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return { items, total, page, limit };
    }

    async addTransaction(userId: number, amount: number, type: string, description: string, createdBy?: number) {
        if (amount === 0) return;

        // If negative (spending), check balance
        if (amount < 0) {
            const current = await this.getBalance(userId);
            if (current + amount < 0) {
                throw new BadRequestException('Số dư điểm không đủ');
            }
        }

        const tx = this.repo.create({
            userId,
            amount,
            type,
            description,
            createdBy,
        });
        return this.repo.save(tx);
    }
}
