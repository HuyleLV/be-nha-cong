import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThuChi } from './entities/thu-chi.entity';
import { ThuChiItem } from './entities/thu-chi-item.entity';
import { CreateThuChiDto } from './dto/create-thu-chi.dto';

@Injectable()
export class ThuChiService {
  constructor(
    @InjectRepository(ThuChi) private repo: Repository<ThuChi>,
    @InjectRepository(ThuChiItem) private itemRepo: Repository<ThuChiItem>,
  ) {}

  async create(dto: CreateThuChiDto) {
    const ent = this.repo.create({
      type: dto.type,
      buildingId: dto.buildingId ?? null,
      apartmentId: dto.apartmentId ?? null,
      contractId: dto.contractId ?? null,
      title: dto.title,
      payerName: dto.payerName ?? null,
      account: dto.account ?? null,
      date: new Date(dto.date),
      note: dto.note ?? null,
      items: (dto.items || []).map((it) => ({
        category: it.category,
        amount: it.amount ?? null,
        startDate: it.startDate ? new Date(it.startDate) : null,
        endDate: it.endDate ? new Date(it.endDate) : null,
      })),
    });
    return this.repo.save(ent);
  }

  async findAll(params?: any) {
    const qb = this.repo.createQueryBuilder('t').leftJoinAndSelect('t.items', 'it');
    if (params?.buildingId) qb.andWhere('t.building_id = :buildingId', { buildingId: params.buildingId });
    if (params?.apartmentId) qb.andWhere('t.apartment_id = :apartmentId', { apartmentId: params.apartmentId });
    const list = await qb.getMany();
    return list;
  }

  async findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['items'] });
  }

  async update(id: number, dto: Partial<CreateThuChiDto>) {
    const ent = await this.findOne(id);
    if (!ent) return null;
    Object.assign(ent, {
      type: dto.type ?? ent.type,
      buildingId: dto.buildingId ?? ent.buildingId,
      apartmentId: dto.apartmentId ?? ent.apartmentId,
      contractId: dto.contractId ?? ent.contractId,
      title: dto.title ?? ent.title,
      payerName: dto.payerName ?? ent.payerName,
      account: dto.account ?? ent.account,
      date: dto.date ? new Date(dto.date) : ent.date,
      note: dto.note ?? ent.note,
    });
    if (dto.items) {
      // replace items
      await this.itemRepo.delete({ thuChiId: id } as any);
      ent.items = (dto.items || []).map((it) => this.itemRepo.create({
        category: it.category,
        amount: it.amount ?? null,
        startDate: it.startDate ? new Date(it.startDate) : null,
        endDate: it.endDate ? new Date(it.endDate) : null,
        thuChiId: id,
      }));
    }
    return this.repo.save(ent);
  }

  async remove(id: number) {
    return this.repo.delete(id);
  }
}
