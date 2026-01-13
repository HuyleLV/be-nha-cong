import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { User } from '../users/entities/user.entity';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { QueryServiceRequestDto } from './dto/query-service-request.dto';
import { Contract } from '../contracts/entities/contract.entity';
import { Deposit } from '../deposits/entities/deposit.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest) private readonly repo: Repository<ServiceRequest>,
    @InjectRepository(Contract) private readonly contractRepo: Repository<Contract>,
    @InjectRepository(Deposit) private readonly depositRepo: Repository<Deposit>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(dto: CreateServiceRequestDto, userId?: number) {
    // Normalize requestedAt (accept ISO string from DTO)
    const payload: any = { ...(dto as any), createdBy: userId ?? null, status: (dto as any).status ?? 'pending' };
    if (payload.requestedAt) {
      try { payload.requestedAt = new Date(payload.requestedAt); } catch (e) { payload.requestedAt = null; }
    }

  // Auto-attach building/apartment by requester (customer) latest contract or deposit
    if ((!payload.buildingId && !payload.apartmentId) && userId) {
      try {
        // Prefer latest contract
        const contracts = await this.contractRepo.find({ where: { customerId: userId }, order: { createdAt: 'DESC' }, take: 1 });
        const latestContract = contracts?.[0];
        if (latestContract) {
          payload.buildingId = latestContract.buildingId ?? payload.buildingId;
          payload.apartmentId = latestContract.apartmentId ?? payload.apartmentId;
          payload.customerId = payload.customerId ?? userId;
        } else {
          // Fallback to latest deposit
          const deposits = await this.depositRepo.find({ where: { customerId: userId }, order: { createdAt: 'DESC' }, take: 1 });
          const latestDeposit = deposits?.[0];
          if (latestDeposit) {
            payload.buildingId = latestDeposit.buildingId ?? payload.buildingId;
            payload.apartmentId = latestDeposit.apartmentId ?? payload.apartmentId;
            payload.customerId = payload.customerId ?? userId;
          }
        }
      } catch (e) {
        // swallow lookup errors; proceed without auto-attach
      }
    }

    // Enforce: only one request per day per type (fire/repair) per customer
    const reqType = (payload.type || '').trim();
    const custId = payload.customerId || userId || null;
    if (reqType && custId) {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(start.getDate() + 1);
      const qb = this.repo.createQueryBuilder('r')
        .where('r.type = :tp', { tp: reqType })
        .andWhere('(r.customer_id = :cid OR r.created_by = :cid)', { cid: custId })
        .andWhere('r.created_at >= :start AND r.created_at < :end', { start, end });
      const count = await qb.getCount();
      if (count >= 1) {
        throw new BadRequestException(reqType === 'fire' ? 'Mỗi ngày chỉ được gửi 1 yêu cầu báo cháy' : 'Mỗi ngày chỉ được gửi 1 yêu cầu báo sửa chữa');
      }
    }

  const ent = this.repo.create(payload);
  const res = await this.repo.save(ent as any);
  const saved: ServiceRequest = (Array.isArray(res) ? res[0] : (res as ServiceRequest));
    try {
      // Emit to admin room
      this.gateway.emitToRoom('admin', 'service-request:new', saved);
      // Emit to user room for requester
      const notifyUserId = saved.customerId || saved.createdBy || userId;
      if (notifyUserId) this.gateway.emitToRoom(`user:${notifyUserId}`, 'service-request:new', saved);
    } catch {}
    return saved;
  }

  async findAll(q: QueryServiceRequestDto, user?: any) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo.createQueryBuilder('r').orderBy('r.id', 'DESC').take(limit).skip((page - 1) * limit);

    if (q.q) qb.andWhere('(r.title LIKE :kw OR r.description LIKE :kw)', { kw: `%${q.q}%` });
    if (q.buildingId) qb.andWhere('r.building_id = :bid', { bid: q.buildingId });
    if (q.apartmentId) qb.andWhere('r.apartment_id = :aid', { aid: q.apartmentId });
    if (q.status) qb.andWhere('r.status = :st', { st: q.status });
  if ((q as any).type) qb.andWhere('r.type = :tp', { tp: (q as any).type });

  // join customer info for convenience (name, phone)
  qb.leftJoinAndMapOne('r.customer', User, 'customer', 'customer.id = r.customer_id');

    // If user is host, restrict to their own created items
    if (user && (user.role === 'host' || user.role === 'Host')) {
      const uid = user.id ?? user.sub ?? null;
      if (uid) qb.andWhere('r.created_by = :uid', { uid });
    }

    // If user is resident/user, restrict to their own requests
    if (user && (String(user.role).toLowerCase() === 'user' || String(user.role).toLowerCase() === 'resident')) {
      const uid = user.id ?? user.sub ?? null;
      if (uid) qb.andWhere('(r.customer_id = :uid OR r.created_by = :uid)', { uid });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: { total, page, limit, pageCount: Math.ceil(total / limit) } };
  }

  async findOne(id: number, user?: any) {
    const qb = this.repo.createQueryBuilder('r').where('r.id = :id', { id });
    qb.leftJoinAndMapOne('r.customer', User, 'customer', 'customer.id = r.customer_id');
    const it = await qb.getOne();
    if (!it) throw new NotFoundException('Service Request not found');
    return it;
  }

  async update(id: number, dto: UpdateServiceRequestDto, userId?: number, userRole?: string) {
    const it = await this.repo.findOne({ where: { id } });
    if (!it) throw new NotFoundException('Service Request not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(it.createdBy) !== String(userId)) throw new NotFoundException('Không có quyền sửa yêu cầu này');
    }
    const payload: any = { ...(dto as any) };
    if (payload.requestedAt) {
      try { payload.requestedAt = new Date(payload.requestedAt); } catch (e) { payload.requestedAt = null; }
    }
    Object.assign(it as any, payload);
    return this.repo.save(it);
  }

  async remove(id: number, userId?: number, userRole?: string) {
    const it = await this.repo.findOne({ where: { id } });
    if (!it) throw new NotFoundException('Service Request not found');
    if (userRole && (userRole === 'host' || userRole === 'Host')) {
      if (String(it.createdBy) !== String(userId)) throw new NotFoundException('Không có quyền xóa yêu cầu này');
    }
    await this.repo.delete(id);
    return { success: true };
  }
}
