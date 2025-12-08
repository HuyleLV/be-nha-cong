import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Inject } from '@nestjs/common';
import { ContractsService } from '../contracts/contracts.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
    @Inject(ContractsService) private contractsService: ContractsService,
    @Inject(NotificationsGateway) private gateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    const ent = this.repo.create(dto as any);
  const saved = await this.repo.save(ent as unknown as Notification);
    await this.dispatchToRecipients(saved);
    return saved;
  }

  async findAll(query?: any) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    const qb = this.repo.createQueryBuilder('n').orderBy('n.created_at','DESC');
    const total = await qb.getCount();
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { items, meta: { page, limit, totalPages, total } };
  }

  async findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, dto: UpdateNotificationDto) {
    await this.repo.update(id, dto as any);
  const updated = await this.findOne(id) as Notification | null;
    if (updated) await this.dispatchToRecipients(updated);
    return updated;
  }

  async remove(id: number) {
    return this.repo.delete(id);
  }
  private async dispatchToRecipients(notification: Notification) {
    const type = notification.recipientType;
    let contracts: any[] = [];
    if (type === 'building' && notification.buildingId) {
      contracts = await this.contractsService.findByBuildingId(notification.buildingId);
    } else if (type === 'apartment' && notification.apartmentId) {
      contracts = await this.contractsService.findByApartmentId(notification.apartmentId);
    }
    // Emit to each customer room
    for (const c of contracts) {
      const customerRoom = c.customerId ? `user:${c.customerId}` : (c.id ? `contract:${c.id}` : undefined);
      if (customerRoom) {
        this.gateway.emitToRoom(customerRoom, 'notification:new', {
          id: notification.id,
          title: notification.title,
          content: notification.content,
          attachments: notification.attachments,
          recipientType: notification.recipientType,
          buildingId: notification.buildingId,
          apartmentId: notification.apartmentId,
          createdAt: notification.createdAt,
        });
      }
    }
  }
}
