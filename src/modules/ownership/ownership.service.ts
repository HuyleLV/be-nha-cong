import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ownership } from './entities/ownership.entity';
import { CreateOwnershipDto } from './dto/create-ownership.dto';
import { UpdateOwnershipDto } from './dto/update-ownership.dto';
import { QueryOwnershipDto } from './dto/query-ownership.dto';
import { Building } from '../building/entities/building.entity'; 
import { User } from '../users/entities/user.entity';

@Injectable()
export class OwnershipsService {
    constructor(
        @InjectRepository(Ownership) private readonly repo: Repository<Ownership>,
        @InjectRepository(Building) private readonly bRepo: Repository<Building>,
        @InjectRepository(User) private readonly uRepo: Repository<User>,
    ) {}

    async findAll(q: QueryOwnershipDto) {
        const page = q.page ?? 1;
        const limit = q.limit ?? 20;

        const qb = this.repo.createQueryBuilder('o')
            .leftJoinAndSelect('o.user', 'u')
            .leftJoinAndSelect('o.building', 'b')
            .orderBy('o.created_at', 'DESC')
            .take(limit)
            .skip((page - 1) * limit);

        if (q.userId) qb.andWhere('o.user_id = :uid', { uid: q.userId });
        if (q.buildingId) qb.andWhere('o.building_id = :bid', { bid: q.buildingId });
        if (q.role) qb.andWhere('o.role = :r', { r: q.role });

        const [items, total] = await qb.getManyAndCount();
        return { items, meta: { total, page, limit, pageCount: Math.ceil(total / limit) } };
    }

    async create(dto: CreateOwnershipDto) {
        const user = await this.uRepo.findOne({ where: { id: dto.userId } });
        if (!user) throw new BadRequestException('User không tồn tại');

        const building = await this.bRepo.findOne({ where: { id: dto.buildingId } });
        if (!building) throw new BadRequestException('Building không tồn tại');

        const existed = await this.repo.findOne({ where: { userId: dto.userId, buildingId: dto.buildingId } });
        if (existed) throw new BadRequestException('User đã có quyền với building này');

        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async update(id: number, dto: UpdateOwnershipDto) {
        const own = await this.repo.findOne({ where: { id } });
        if (!own) throw new NotFoundException('Ownership không tồn tại');

        // Không cho đổi userId/buildingId để giữ unique; chỉ đổi role
        if ((dto as any).userId || (dto as any).buildingId) {
            throw new BadRequestException('Không thể đổi userId/buildingId của Ownership; hãy xoá và tạo lại');
        }

        Object.assign(own, { role: dto.role ?? own.role });
        return this.repo.save(own);
    }

    async remove(id: number) {
        const ok = await this.repo.findOne({ where: { id } });
        if (!ok) throw new NotFoundException('Ownership không tồn tại');
        await this.repo.delete(id);
        return { success: true };
    }
}
