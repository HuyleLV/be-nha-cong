import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CtvRequest } from './entities/ctv-request.entity';
import { CreateCtvRequestDto } from './dto/create-ctv-request.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CtvRequestsService {
  constructor(
    @InjectRepository(CtvRequest) private readonly repo: Repository<CtvRequest>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) { }

  async create(dto: CreateCtvRequestDto, user?: any) {
    const userId = user?.id ?? dto.userId;
    if (userId) {
      const existing = await this.repo.findOne({
        where: [
          { userId, status: 'pending' },
          { userId, status: 'approved' }
        ]
      });
      if (existing) {
        throw new ConflictException('Bạn đã gửi yêu cầu hoặc đã là CTV rồi.');
      }
    }

    const entity = this.repo.create({
      userId: userId,
      name: dto.name ?? user?.name,
      email: dto.email ?? user?.email,
      note: dto.note ?? null,
      status: 'pending',
    });
    return this.repo.save(entity);
  }

  async findAll(status?: string) {
    const whereCondition = status ? { status } : {};
    return this.repo.find({
      where: whereCondition,
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async approve(id: number, adminId?: number) {
    const req = await this.findOne(id);
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending') return req;

    // mark request approved
    req.status = 'approved';
    await this.repo.save(req);

    // mark user as CTV
    if (req.userId) {
      const user = await this.userRepo.findOneBy({ id: Number(req.userId) });
      if (user) {
        (user as any).isCtv = true;
        await this.userRepo.save(user);
      }
    }

    return req;
  }

  async reject(id: number, adminId?: number) {
    const req = await this.findOne(id);
    if (!req) throw new NotFoundException('Request not found');
    req.status = 'rejected';
    return this.repo.save(req);
  }
}
