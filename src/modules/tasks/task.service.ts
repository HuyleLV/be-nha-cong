import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(@InjectRepository(Task) private repo: Repository<Task>) { }

  async create(dto: CreateTaskDto) {
    const ent = this.repo.create(dto as any);
    return this.repo.save(ent);
  }

  async findAll(query?: any) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    const qb = this.repo.createQueryBuilder('t').orderBy('t.created_at', 'DESC');
    const total = await qb.getCount();
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { items, meta: { page, limit, totalPages, total } };
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

  async getReports(user?: any) {
    // 1. Overview Stats
    const totalQb = this.repo.createQueryBuilder('t');
    const doneQb = this.repo.createQueryBuilder('t').where("t.status = 'da_nghiem_thu'");
    const pendingQb = this.repo.createQueryBuilder('t').where("t.status = 'cho_nghiem_thu'");
    const overdueQb = this.repo.createQueryBuilder('t')
      .where("(t.status = 'qua_han') OR (t.status != 'da_nghiem_thu' AND t.status != 'khong_dat' AND t.dueDate < :today)", { today: new Date().toISOString().split('T')[0] });

    // Permission check
    if (user && user.role !== 'admin' && user.role !== 'Admin' && user.role !== 'host' && user.role !== 'Host') {
      // Filter for staff/standard users
      // Try matching name or email
      const condition = "(t.assignee = :name OR t.assignee = :email)";
      const params = { name: user.name, email: user.email };

      totalQb.andWhere(condition, params);
      doneQb.andWhere(condition, params);
      pendingQb.andWhere(condition, params);
      overdueQb.andWhere(condition, params);
    }

    const total = await totalQb.getCount();
    const done = await doneQb.getCount();
    const pending = await pendingQb.getCount();
    const overdue = await overdueQb.getCount();

    // 2. Staff Stats - If filtering, we only see own stats
    const staffQb = this.repo.createQueryBuilder('t')
      .select('t.assignee', 'name')
      .addSelect("SUM(CASE WHEN t.status = 'da_nghiem_thu' THEN 1 ELSE 0 END)", 'done')
      .addSelect("SUM(CASE WHEN ((t.status = 'qua_han') OR (t.status != 'da_nghiem_thu' AND t.status != 'khong_dat' AND t.dueDate < :today)) THEN 1 ELSE 0 END)", 'overdue')
      .addSelect("COUNT(t.id)", 'total')
      .setParameter('today', new Date().toISOString().split('T')[0])
      .where('t.assignee IS NOT NULL')
      .groupBy('t.assignee');

    if (user && user.role !== 'admin' && user.role !== 'Admin' && user.role !== 'host' && user.role !== 'Host') {
      staffQb.andWhere("(t.assignee = :name OR t.assignee = :email)", { name: user.name, email: user.email });
    }

    const staffStats = await staffQb.getRawMany();

    // 3. Completion Rate
    const completionRate = total > 0 ? (done / total) * 100 : 0;

    return {
      stats: { total, done, pending, overdue },
      staffPerformance: staffStats.map(s => ({
        name: s.name,
        done: Number(s.done),
        overdue: Number(s.overdue),
        total: Number(s.total),
        rate: Number(s.total) > 0 ? (Number(s.done) / Number(s.total)) * 100 : 0
      })),
      completionRate
    };
  }
}
