// src/modules/favorites/favorites.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Apartment } from '../apartment/entities/apartment.entity'; 
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { QueryFavoriteDto } from './dto/query-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite) private readonly repo: Repository<Favorite>,
    @InjectRepository(Apartment) private readonly aptRepo: Repository<Apartment>,
  ) {}

  /** Thêm yêu thích (idempotent) */
  async add(userId: number, dto: CreateFavoriteDto) {
    const apt = await this.aptRepo.findOne({ where: { id: dto.apartmentId } });
    if (!apt) throw new NotFoundException('Phòng không tồn tại');

    const existed = await this.repo.findOne({ where: { userId, apartmentId: dto.apartmentId } });
    if (existed) return existed;

    const entity = this.repo.create({ userId, apartmentId: dto.apartmentId });
    return this.repo.save(entity);
  }

  /** Bỏ yêu thích (idempotent) */
  async remove(userId: number, apartmentId: number) {
    await this.repo.delete({ userId, apartmentId });
    return { success: true };
  }

  /** Toggle: nếu chưa có -> thêm; nếu có -> xóa */
  async toggle(userId: number, dto: CreateFavoriteDto) {
    const existed = await this.repo.findOne({ where: { userId, apartmentId: dto.apartmentId } });
    if (existed) {
      await this.repo.delete({ userId, apartmentId: dto.apartmentId });
      return { favorited: false };
    } else {
      await this.add(userId, dto);
      return { favorited: true };
    }
  }

  /** Kiểm tra đã yêu thích chưa */
  async isFavorited(userId: number, apartmentId: number) {
    const existed = await this.repo.exist({ where: { userId, apartmentId } });
    return { favorited: !!existed };
  }

  async findMine(userId: number, q: QueryFavoriteDto) {
    const page  = q.page  ?? 1;
    const limit = q.limit ?? 12;
  
    // 1) Lấy danh sách favorite theo trang
    const [favs, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  
    // 2) Lấy toàn bộ Apartment tương ứng (không join entity, chỉ find by ids)
    const aptIds = [...new Set(favs.map(f => f.apartmentId))];
    const apts = aptIds.length ? await this.aptRepo.findBy({ id: In(aptIds) }) : [];
  
    // 3) Map theo id để gắn lại đúng từng favorite
    const aptMap = new Map<number, Apartment>(apts.map(a => [a.id, a]));
  
    // 4) Trả ra items: mỗi item gồm info favorite + full apartment
    const items = favs.map(f => {
      const apt = aptMap.get(f.apartmentId) || null;
      // Trả full apartment; có thể bổ sung cờ favorited cho FE
      const apartment = apt ? { ...(apt as any), favorited: true } : null;
  
      return {
        id: f.id,
        userId: f.userId,
        apartmentId: f.apartmentId,
        createdAt: f.createdAt,
        apartment, // <— full apartment entity (mọi field), hoặc null nếu phòng đã bị xóa
      };
    });
  
    return {
      items,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    };
  }
}
