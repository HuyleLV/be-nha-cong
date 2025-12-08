import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, MoreThan } from 'typeorm';
import { Contract, ContractStatus } from './entities/contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract) private readonly repo: Repository<Contract>,
  ) {}

  async findAll(params?: { page?: number; limit?: number; ownerId?: number; status?: string; apartmentId?: number }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('c').orderBy('c.created_at', 'DESC').skip(skip).take(limit);

    if (params?.ownerId) {
      qb.andWhere('c.created_by = :ownerId', { ownerId: params.ownerId });
    }

    if (params?.status) {
      qb.andWhere('c.status = :status', { status: params.status });
    }

    if (params?.apartmentId) {
      qb.andWhere('c.apartment_id = :apartmentId', { apartmentId: params.apartmentId });
    }

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Contract not found');
    return item;
  }

  async create(dto: CreateContractDto, createdBy?: number) {
    const ent = this.repo.create({
      ...dto,
      signDate: dto.signDate ? new Date(dto.signDate) : null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      billingStartDate: dto.billingStartDate ? new Date(dto.billingStartDate) : null,
      createdBy: createdBy || null,
    } as any);
    return this.repo.save(ent);
  }

  async update(id: number, dto: UpdateContractDto) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Contract not found');
    Object.assign(item, dto);
    if ((dto as any).signDate) item.signDate = new Date((dto as any).signDate);
    if ((dto as any).startDate) item.startDate = new Date((dto as any).startDate);
    if ((dto as any).expiryDate) item.expiryDate = new Date((dto as any).expiryDate);
    if ((dto as any).billingStartDate) item.billingStartDate = new Date((dto as any).billingStartDate);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Contract not found');
    await this.repo.remove(item);
    return { deleted: true };
  }

  // Stats: counts for all, expiring soon (expiry within X days), expired, terminated
  async stats(ownerId?: number) {
    const qb = this.repo.createQueryBuilder('c');
    if (ownerId) qb.andWhere('c.created_by = :ownerId', { ownerId });

    const total = await qb.getCount();

    // Expiring soon: expiryDate between now and 14 days from now
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + 14);

    const expiringSoonQb = this.repo.createQueryBuilder('c').andWhere('c.expiry_date BETWEEN :now AND :soon', { now, soon });
    if (ownerId) expiringSoonQb.andWhere('c.created_by = :ownerId', { ownerId });
    const expiringSoon = await expiringSoonQb.getCount();

    const expiredQb = this.repo.createQueryBuilder('c').andWhere('c.expiry_date < :now', { now });
    if (ownerId) expiredQb.andWhere('c.created_by = :ownerId', { ownerId });
    const expired = await expiredQb.getCount();

    const terminatedQb = this.repo.createQueryBuilder('c').andWhere('c.status = :st', { st: ContractStatus.TERMINATED });
    if (ownerId) terminatedQb.andWhere('c.created_by = :ownerId', { ownerId });
    const terminated = await terminatedQb.getCount();

    return { total, expiringSoon, expired, terminated };
  }
  async findByBuildingId(buildingId: number){
    return this.repo.find({ where: { buildingId } });
  }

  async findByApartmentId(apartmentId: number){
    return this.repo.find({ where: { apartmentId } });
  }
}
