import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';

@Injectable()
export class OffersService {
    constructor(
        @InjectRepository(Offer) private readonly repo: Repository<Offer>,
    ) { }

    async create(data: Partial<Offer>, userId?: number) {
        const offer = this.repo.create({ ...data, createdBy: userId });
        return this.repo.save(offer);
    }

    async findAll(activeOnly: boolean = false) {
        const where: any = {};
        if (activeOnly) {
            where.active = true;
        }
        return this.repo.find({ where, order: { createdAt: 'DESC' } });
    }

    async findOne(id: number) {
        return this.repo.findOne({ where: { id } });
    }

    async update(id: number, data: Partial<Offer>) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        return this.repo.delete(id);
    }
}
