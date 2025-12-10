import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Deposit } from './entities/deposit.entity';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { User } from '../users/entities/user.entity';
import { Apartment } from '../apartment/entities/apartment.entity';

@Injectable()
export class DepositsService {
  constructor(
    @InjectRepository(Deposit) private readonly repo: Repository<Deposit>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Apartment) private readonly aptRepo: Repository<Apartment>,
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

  async remove(id: number, requester?: any) {
    const item = await this.repo.findOneBy({ id });
    if (!item) throw new NotFoundException('Deposit not found');

    // If admin or no requester (internal), allow
    if (!requester || String(requester.role).toLowerCase() === 'admin') {
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
