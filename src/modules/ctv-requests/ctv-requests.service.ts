import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
  ) {}

  async create(dto: CreateCtvRequestDto, user?: any) {
    const entity = this.repo.create({
      userId: user?.id ?? dto.userId,
      name: dto.name ?? user?.name,
      email: dto.email ?? user?.email,
      note: dto.note ?? null,
      status: 'pending',
    });
    return this.repo.save(entity);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
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
