import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(@InjectRepository(Notification) private repo: Repository<Notification>) {}

  async create(dto: CreateNotificationDto) {
    const ent = this.repo.create(dto as any);
    return this.repo.save(ent);
  }

  async findAll(query?: any) {
    const qb = this.repo.createQueryBuilder('n').orderBy('n.createdAt','DESC');
    const items = await qb.getMany();
    return { items, total: items.length };
  }

  async findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, dto: UpdateNotificationDto) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.repo.delete(id);
  }
}
