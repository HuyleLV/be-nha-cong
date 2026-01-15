import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { ThuChi } from '../thu-chi/entities/thu-chi.entity';
import { ThuChiItem } from '../thu-chi/entities/thu-chi-item.entity';
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

  /**
   * Best-effort: find a bank account matching a human-readable label (as used by FE snapshot)
   * and apply a delta to its balance. If ownerId is provided, prefer accounts owned by that owner.
   * If label indicates cash and no account exists, create a Cash account for the owner.
   */
  async adjustBalanceByLabel(label: string | null | undefined, delta: number, ownerId?: number) {
    if (!label || typeof label !== 'string') return null;
    const L = String(label || '').trim();

    // normalize label for simpler matching
    const norm = L.toLowerCase();

    // If label contains 'tiền mặt' treat as cash account
    const isCash = norm.includes('tiền mặt') || norm.includes('tien mat') || norm === 'tiền mặt' || norm === 'tien mat';

    // candidate accounts query
    const candidates = await this.repo.find({ where: ownerId ? { ownerId } : {} });

    let match: BankAccount | undefined;
    if (isCash) {
      match = candidates.find(a => (a.bankName || '').toLowerCase().includes('tiền mặt') || (a.accountNumber || '').toLowerCase() === 'cash' || (a.accountNumber || '').toLowerCase() === 'tiền mặt');
      if (!match) {
        // create a cash account for owner if possible
        const created = this.repo.create({
          accountHolder: 'Tiền mặt',
          accountNumber: 'CASH',
          bankName: 'Tiền mặt',
          branch: null,
          note: 'Quỹ tiền mặt tự động tạo',
          isDefault: false,
          balance: String(0),
          ownerId: ownerId ?? null,
        } as any);
        match = await this.repo.save(created as any);
      }
    } else {
      // try to find best candidate by checking if label contains accountNumber, accountHolder or bankName
      for (const a of candidates) {
        try {
          const accNum = String(a.accountNumber || '').toLowerCase();
          const holder = String(a.accountHolder || '').toLowerCase();
          const bank = String(a.bankName || '').toLowerCase();
          if (!accNum && !holder && !bank) continue;
          if ((accNum && norm.includes(accNum)) || (holder && norm.includes(holder)) || (bank && norm.includes(bank))) {
            match = a; break;
          }
        } catch (e) { /** ignore */ }
      }
      // fallback: if none matched and ownerId not provided, try across all accounts
      if (!match && !ownerId) {
        const all = await this.repo.find();
        for (const a of all) {
          const accNum = String(a.accountNumber || '').toLowerCase();
          const holder = String(a.accountHolder || '').toLowerCase();
          const bank = String(a.bankName || '').toLowerCase();
          if ((accNum && norm.includes(accNum)) || (holder && norm.includes(holder)) || (bank && norm.includes(bank))) { match = a; break; }
        }
      }
    }

    if (!match) return null;

    const current = Number(match.balance ?? 0) || 0;
    const next = current + Number(delta || 0);
    match.balance = String(next);
    const saved = await this.repo.save(match);
    return saved;
  }

  /**
   * Return daily cashbook per account between start and end (inclusive).
   * Result: array of { date: 'YYYY-MM-DD', accountId, accountLabel, startingBalance, totalThu, totalChi, endingBalance }
   */
  async hostDailyCashbook(userId: number, startDate: string, endDate: string) {
    // normalize dates
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

    // get owner's accounts
    const accounts = await this.repo.find({ where: { ownerId: userId } });
    const results: any[] = [];

    // helper to format date YYYY-MM-DD
    const fmt = (d: Date) => d.toISOString().slice(0,10);

    // for each account, compute sum before start, and daily aggregates inside range
    for (const acc of accounts) {
      const kw = `%${acc.accountNumber}%`;
      // sum before start
      const qbBefore = this.repo.manager.getRepository(ThuChi).createQueryBuilder('t')
        .leftJoin('t.items','it')
        .select("COALESCE(SUM(CASE WHEN t.type = 'thu' THEN COALESCE(it.amount,0) WHEN t.type = 'chi' THEN -COALESCE(it.amount,0) ELSE 0 END), 0)", 'sum')
        .where('t.account LIKE :kw', { kw })
        .andWhere('t.date < :start', { start: fmt(start) });
      const rawBefore: any = await qbBefore.getRawOne();
      const sumBefore = Number(rawBefore?.sum ?? 0) || 0;

      // daily aggregates inside range grouped by date and type
      const qbDaily = this.repo.manager.getRepository(ThuChi).createQueryBuilder('t')
        .leftJoin('t.items','it')
        .select('t.date', 'date')
        .addSelect("SUM(CASE WHEN t.type = 'thu' THEN COALESCE(it.amount,0) ELSE 0 END)", 'thu')
        .addSelect("SUM(CASE WHEN t.type = 'chi' THEN COALESCE(it.amount,0) ELSE 0 END)", 'chi')
        .where('t.account LIKE :kw', { kw })
        .andWhere('t.date BETWEEN :start AND :end', { start: fmt(start), end: fmt(end) })
        .groupBy('t.date')
        .orderBy('t.date', 'ASC');
      const dailyRows: any[] = await qbDaily.getRawMany();

      // map dates to totals
      const dateMap: Record<string, { thu:number; chi:number }> = {};
      for (const r of dailyRows) {
        const d = fmt(new Date(r.date));
        dateMap[d] = { thu: Number(r.thu ?? 0) || 0, chi: Number(r.chi ?? 0) || 0 };
      }

      // iterate days
      let running = sumBefore;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
        const day = fmt(new Date(d));
        const totals = dateMap[day] ?? { thu: 0, chi: 0 };
        const starting = running;
        const totalThu = totals.thu;
        const totalChi = totals.chi;
        const ending = starting + totalThu - totalChi;
        results.push({ date: day, accountId: acc.id, accountLabel: `${acc.bankName} — ${acc.accountNumber}${acc.branch ? ' — ' + acc.branch : ''} (${acc.accountHolder})`, startingBalance: starting, totalThu, totalChi, endingBalance: ending });
        running = ending;
      }
    }

    // sort by date then accountId
    results.sort((a,b)=> a.date.localeCompare(b.date) || (a.accountId - b.accountId));
    return results;
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
      balance: dto.balance ? String(dto.balance) : '0',
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
    if (dto.balance !== undefined) item.balance = String(dto.balance);

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

  // compute balances for each bank account of the owner by summing thu_chi items
  async hostBalances(userId: number) {
    const accounts = await this.repo.find({ where: { ownerId: userId } });
    const results: { id: number; balance: number }[] = [];
    for (const acc of accounts) {
      // We try to match thu_chi.account by accountNumber occurrence (best-effort)
      const kw = `%${acc.accountNumber}%`;
      const qb = this.repo.manager.getRepository(ThuChi).createQueryBuilder('t')
        .leftJoin('t.items', 'it')
        .select("COALESCE(SUM(CASE WHEN t.type = 'thu' THEN COALESCE(it.amount,0) WHEN t.type = 'chi' THEN -COALESCE(it.amount,0) ELSE 0 END), 0)", 'sum')
        .where('t.account LIKE :kw', { kw });

      const raw: any = await qb.getRawOne();
      const sum = raw?.sum ?? 0;
      const n = Number(sum);
      results.push({ id: acc.id, balance: Number.isFinite(n) ? n : 0 });
    }
    return results;
  }
}
