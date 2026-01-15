import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Deposit } from './entities/deposit.entity';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { User } from '../users/entities/user.entity';
import { Apartment } from '../apartment/entities/apartment.entity';
import { BankAccount } from '../bank-accounts/entities/bank-account.entity';

@Injectable()
export class DepositsService {
  constructor(
    @InjectRepository(Deposit) private readonly repo: Repository<Deposit>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Apartment) private readonly aptRepo: Repository<Apartment>,
    @InjectRepository(BankAccount) private readonly bankRepo: Repository<BankAccount>,
  ) {}

  /**
   * Find deposits with optional pagination. Returns { items, total, page, limit }
   */
  async findAll(params?: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await this.repo.findAndCount({ order: { createdAt: 'DESC' }, skip, take: limit });

    // Fetch customer names for items that have customerId
    const custIds = Array.from(new Set(items.filter(i => i.customerId).map(i => i.customerId!)));
    let userMap: Record<number, { id: number; name?: string; phone?: string }> = {};
    if (custIds.length > 0) {
      const users = await this.userRepo.find({ where: { id: In(custIds) } });
      for (const u of users) userMap[u.id] = { id: u.id, name: u.name, phone: u.phone };
    }

    const mapped = items.map(i => ({
      ...i,
      customerName: i.customerId ? (userMap[i.customerId]?.name ?? null) : null,
      customerPhone: i.customerId ? (userMap[i.customerId]?.phone ?? null) : null,
    }));

    return { items: mapped, total, page, limit };
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Deposit not found');
    return item;
  }

  async create(dto: CreateDepositDto, requester?: any) {
    const ent = this.repo.create({ ...dto, depositDate: dto.depositDate ? new Date(dto.depositDate) : null, moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : null, billingStartDate: dto.billingStartDate ? new Date(dto.billingStartDate) : null });
    const saved = await this.repo.save(ent);
    try {
      const amount = Number(dto.depositAmount ?? 0) || 0;
      if (amount !== 0 && dto.account) {
        const ownerId = requester && requester.id ? Number(requester.id) : undefined;
        // attempt to find matching bank account and adjust balance
        // reuse BankAccount matching logic similar to bank-accounts service
        const accounts = ownerId ? await this.bankRepo.find({ where: { ownerId } }) : await this.bankRepo.find();
        let match = accounts.find(a => dto.account?.includes(a.accountNumber ?? '') || dto.account?.includes(a.accountHolder ?? '') || dto.account?.includes(a.bankName ?? ''));
        if (!match && ownerId) {
          // fallback to any account
          const all = await this.bankRepo.find();
          match = all.find(a => dto.account?.includes(a.accountNumber ?? '') || dto.account?.includes(a.accountHolder ?? '') || dto.account?.includes(a.bankName ?? ''));
        }
        if (match) {
          match.balance = String((Number(match.balance ?? 0) || 0) + amount);
          await this.bankRepo.save(match);
        } else if (String(dto.account).toLowerCase().includes('tiền mặt') || String(dto.account).toLowerCase().includes('tien mat')) {
          // create cash account for owner if not exists
          const cash = this.bankRepo.create({ accountHolder: 'Tiền mặt', accountNumber: 'CASH', bankName: 'Tiền mặt', branch: null, note: 'Quỹ tiền mặt tự động tạo', isDefault: false, balance: String(amount), ownerId: ownerId ?? null } as any);
          await this.bankRepo.save(cash as any);
        }
      }
    } catch (e) { console.error('Failed to adjust bank account balance for deposit', e); }
    return saved;
  }

  async update(id: number, dto: UpdateDepositDto) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Deposit not found');
    Object.assign(item, dto);
    if ((dto as any).depositDate) item.depositDate = new Date((dto as any).depositDate);
    if ((dto as any).moveInDate) item.moveInDate = new Date((dto as any).moveInDate);
    if ((dto as any).billingStartDate) item.billingStartDate = new Date((dto as any).billingStartDate);
    const before = await this.repo.findOneBy({ id });
    const saved = await this.repo.save(item);
    try {
      // adjust bank account balance by delta if account present
      const oldAmount = Number((before as any)?.depositAmount ?? 0) || 0;
      const newAmount = Number((dto as any)?.depositAmount ?? (saved as any).depositAmount ?? 0) || 0;
      const delta = newAmount - oldAmount;
      if (delta !== 0 && (dto as any).account) {
        const accLabel = (dto as any).account;
        const accounts = await this.bankRepo.find();
        let match = accounts.find(a => accLabel?.includes(a.accountNumber ?? '') || accLabel?.includes(a.accountHolder ?? '') || accLabel?.includes(a.bankName ?? ''));
        if (match) { match.balance = String((Number(match.balance ?? 0) || 0) + delta); await this.bankRepo.save(match); }
      }
    } catch (e) { console.error('Failed to adjust bank account balance for deposit update', e); }
    return saved;
  }

  async remove(id: number, requester?: any) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Deposit not found');

    // If admin or no requester (internal), allow
    if (!requester || String(requester.role).toLowerCase() === 'admin') {
      // reverse balance effect
      try {
        const amt = Number(item.depositAmount ?? 0) || 0;
        if (amt !== 0 && item.account) {
          const accounts = await this.bankRepo.find();
          const match = accounts.find(a => String(item.account).includes(a.accountNumber ?? '') || String(item.account).includes(a.accountHolder ?? '') || String(item.account).includes(a.bankName ?? ''));
          if (match) { match.balance = String((Number(match.balance ?? 0) || 0) - amt); await this.bankRepo.save(match); }
        }
      } catch (e) { console.error('Failed to reverse bank account balance for deposit delete', e); }
      await this.repo.remove(item);
      return { deleted: true };
    }

    // Hosts (owners) may delete deposits they created for their apartments or for their customers
    if (String(requester.role).toLowerCase() === 'host' || String(requester.role).toLowerCase() === 'owner') {
      const hostId = Number(requester.id);
      let allowed = false;

      // If deposit is tied to an apartment, check apartment.createdById
      if (item.apartmentId) {
        const apt = await this.aptRepo.findOneBy({ id: item.apartmentId });
        if (apt && Number(apt.createdById) === hostId) allowed = true;
      }

      // If deposit references a customer, allow host if they are owner of that customer
      if (!allowed && item.customerId) {
        const cust = await this.userRepo.findOneBy({ id: item.customerId });
        if (cust && cust.ownerId && Number(cust.ownerId) === hostId) allowed = true;
      }

      if (!allowed) {
        throw new ForbiddenException('Bạn không có quyền xóa phiếu đặt cọc này');
      }

      await this.repo.remove(item);
      return { deleted: true };
    }

    throw new ForbiddenException('Bạn không có quyền xóa phiếu đặt cọc này');
  }
}
