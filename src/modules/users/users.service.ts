import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;

    const [items, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit)
      },
    };
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.repo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email đã tồn tại, vui lòng chọn email khác');
    }

    const saltRounds = 10;
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, saltRounds)
      : undefined;
  
    const entity = this.repo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: dto.role
    });
  
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
  
    // Hash mật khẩu mới nếu có
    let passwordHash = user.passwordHash;
    if (dto.password) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(dto.password, saltRounds);
    }
  
    Object.assign(user, {
      name: dto.name ?? user.name,
      email: dto.email ?? user.email,
      phone: dto.phone ?? user.phone,
      passwordHash,
      role: dto.role ?? user.role
    });
  
    return this.repo.save(user);
  }

  async remove(id: number) {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    await this.repo.remove(user);
    return { deleted: true };
  }
}
