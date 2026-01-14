import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { QueryBankAccountDto } from './dto/query-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount) private readonly repo: Repository<BankAccount>,
  ) {}

  async hostList(userId: number, q: QueryBankAccountDto) {
    const page = q.page ?? 1;
    const limit = Math.min(50, q.limit ?? 20);
    const where: any = { ownerId: userId };

    if (q.q) {
      const kw = `%${String(q.q).toLowerCase()}%`;
      // simple LIKE on lower-cased columns via raw SQL is harder; use OR conditions
      where.accountHolder = Like(`%${q.q}%`);
      // Note: We cannot OR directly with TypeORM's findAndCount; for flexible search use query builder
    }

    const qb = this.repo.createQueryBuilder('b')
      .where('b.ownerId = :uid', { uid: userId })
      .orderBy('b.isDefault', 'DESC')
      .addOrderBy('b.updatedAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);

    if (q.q) {
      const kw = `%${String(q.q)}%`;
      qb.andWhere('(b.accountHolder LIKE :kw OR b.accountNumber LIKE :kw OR b.bankName LIKE :kw OR b.branch LIKE :kw)', { kw });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit, pageCount: Math.ceil(total / limit) } };
  }

  async hostGetOne(id: number, userId: number) {
    const item = await this.repo.findOne({ where: { id, ownerId: userId } });
    if (!item) throw new NotFoundException('Tài khoản không tồn tại');
    return item;
  }

  async hostCreate(dto: CreateBankAccountDto, userId: number) {
    const entity = this.repo.create({
      accountHolder: dto.accountHolder.trim(),
      accountNumber: dto.accountNumber.trim(),
      bankName: dto.bankName.trim(),
      branch: dto.branch?.trim() || null,
      note: dto.note?.trim() || null,
      isDefault: !!dto.isDefault,
      ownerId: userId,
    });
    const saved = await this.repo.save(entity);
    // if set as default, unset others
    if (saved.isDefault) {
      await this.repo.createQueryBuilder()
        .update(BankAccount)
        .set({ isDefault: false })
        .where('ownerId = :uid AND id != :id', { uid: userId, id: saved.id })
        .execute();
    }
    return { message: 'Đã tạo tài khoản ngân hàng', data: saved };
  }

  async hostUpdate(id: number, dto: UpdateBankAccountDto, userId: number) {
    const item = await this.repo.findOne({ where: { id, ownerId: userId } });
    if (!item) throw new NotFoundException('Tài khoản không tồn tại');

    if (dto.accountHolder !== undefined) item.accountHolder = String(dto.accountHolder).trim();
    if (dto.accountNumber !== undefined) item.accountNumber = String(dto.accountNumber).trim();
    if (dto.bankName !== undefined) item.bankName = String(dto.bankName).trim();
    if (dto.branch !== undefined) item.branch = (dto.branch ? String(dto.branch).trim() : null);
    if (dto.note !== undefined) item.note = (dto.note ? String(dto.note).trim() : null);
    if (dto.isDefault !== undefined) item.isDefault = !!dto.isDefault;

    const saved = await this.repo.save(item);
    if (saved.isDefault) {
      await this.repo.createQueryBuilder()
        .update(BankAccount)
        .set({ isDefault: false })
        .where('ownerId = :uid AND id != :id', { uid: userId, id: saved.id })
        .execute();
    }
    return { message: 'Đã cập nhật tài khoản', data: saved };
  }

  async hostDelete(id: number, userId: number) {
    const item = await this.repo.findOne({ where: { id, ownerId: userId } });
    if (!item) throw new NotFoundException('Tài khoản không tồn tại');
    await this.repo.delete({ id });
    return { message: 'Đã xóa tài khoản' };
  }
}
