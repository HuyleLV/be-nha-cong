import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';

@Injectable()
export class CommentsService {
  constructor(@InjectRepository(Comment) private readonly repo: Repository<Comment>) {}

  async create(userId: number, targetType: string, targetId: string | number, content: string) {
    const tId = String(targetId);
    const c = this.repo.create({ userId, targetType: targetType as any, targetId: tId, content } as any);
    return this.repo.save(c);
  }

  async list(targetType: string, targetId: string | number, take = 20, skip = 0) {
    const tId = String(targetId);
    const [items, total] = await this.repo.findAndCount({ where: { targetType: targetType as any, targetId: tId }, order: { createdAt: 'DESC' }, take, skip });
    return { items, total };
  }
}
