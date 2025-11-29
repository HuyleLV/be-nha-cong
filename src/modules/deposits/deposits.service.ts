import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit } from './entities/deposit.entity';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';

@Injectable()
export class DepositsService {
  constructor(@InjectRepository(Deposit) private readonly repo: Repository<Deposit>) {}

  async findAll() {
    const items = await this.repo.find({ order: { createdAt: 'DESC' } });
    return items;
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Deposit not found');
    return item;
  }

  async create(dto: CreateDepositDto) {
    const ent = this.repo.create({ ...dto, depositDate: dto.depositDate ? new Date(dto.depositDate) : null, moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : null, billingStartDate: dto.billingStartDate ? new Date(dto.billingStartDate) : null });
    return this.repo.save(ent);
  }

  async update(id: number, dto: UpdateDepositDto) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Deposit not found');
    Object.assign(item, dto);
    if ((dto as any).depositDate) item.depositDate = new Date((dto as any).depositDate);
    if ((dto as any).moveInDate) item.moveInDate = new Date((dto as any).moveInDate);
    if ((dto as any).billingStartDate) item.billingStartDate = new Date((dto as any).billingStartDate);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Deposit not found');
    await this.repo.remove(item);
    return { deleted: true };
  }
}
