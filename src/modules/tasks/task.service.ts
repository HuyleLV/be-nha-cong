import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(@InjectRepository(Task) private repo: Repository<Task>) {}

  async create(dto: CreateTaskDto) {
    const ent = this.repo.create(dto as any);
    return this.repo.save(ent);
  }

  async findAll(query?: any) {
    const qb = this.repo.createQueryBuilder('t').orderBy('t.createdAt','DESC');
    const items = await qb.getMany();
    return { items, total: items.length };
  }

  async findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: number, dto: UpdateTaskDto) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.repo.delete(id);
  }
}
