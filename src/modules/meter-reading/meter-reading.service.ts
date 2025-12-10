import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeterReading } from './entities/meter-reading.entity';
import { MeterReadingItem } from './entities/meter-reading-item.entity';
import { CreateMeterReadingDto } from './dto/create-meter-reading.dto';

@Injectable()
export class MeterReadingService {
  constructor(
    @InjectRepository(MeterReading) private readonly repo: Repository<MeterReading>,
    @InjectRepository(MeterReadingItem) private readonly itemRepo: Repository<MeterReadingItem>,
  ) {}

  async create(dto: CreateMeterReadingDto, userId?: number) {
    // Create the parent entity first
    const entity: any = this.repo.create({
      buildingId: dto.buildingId,
      apartmentId: dto.apartmentId,
      meterType: dto.meterType,
      period: dto.period,
      readingDate: dto.readingDate,
      createdBy: userId ?? null,
    } as any);

    const saved = await this.repo.save(entity);

    // Explicitly create and save items linked to the saved meter reading.
    // Doing this avoids cascade insertion problems in some TypeORM setups.
    if (dto.items && dto.items.length) {
      const newItems = (dto.items || []).map((it) => this.itemRepo.create({
        meterReadingId: saved.id,
        meterReading: saved,
        name: it.name,
        previousIndex: it.previousIndex ?? null,
        newIndex: it.newIndex,
        readingDate: it.readingDate ?? null,
        images: it.images ?? null,
      }));
      const savedItems = await this.itemRepo.save(newItems);
      (saved as any).items = savedItems;
    } else {
      (saved as any).items = [];
    }

    return saved;
  }

  async findAllByUser(userId: number, params?: any) {
    const qb = this.repo.createQueryBuilder('mr').leftJoinAndSelect('mr.items', 'it')
      .where('mr.created_by = :uid', { uid: userId })
      .orderBy('mr.id', 'DESC');

    // pagination
    const page = params?.page ? Number(params.page) : undefined;
    const limit = params?.limit ? Number(params.limit) : 10;
    if (!page) {
      return qb.getMany();
    }

    const total = await qb.getCount();
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { items, meta: { page, limit, totalPages, total } };
  }

  async findOne(id: number, userId?: number) {
    const ok = await this.repo.findOne({ where: { id }, relations: ['items'] });
    if (!ok) throw new NotFoundException('Ghi chỉ số không tồn tại');
    if (userId && String(ok.createdBy) !== String(userId)) throw new ForbiddenException('Không có quyền truy cập');
    return ok;
  }

  async findLatest(apartmentId: number, meterType: 'electricity' | 'water', userId?: number) {
    const qb = this.repo.createQueryBuilder('mr')
      .leftJoinAndSelect('mr.items', 'it')
      .where('mr.apartment_id = :apartmentId', { apartmentId })
      .andWhere('mr.meter_type = :meterType', { meterType })
      .orderBy('mr.reading_date', 'DESC')
      .addOrderBy('mr.id', 'DESC')
      .limit(1);
    if (userId) qb.andWhere('mr.created_by = :uid', { uid: userId });
    const latest = await qb.getOne();
    if (!latest) return null;
    if (userId && String(latest.createdBy) !== String(userId)) throw new ForbiddenException('Không có quyền truy cập');
    return latest;
  }

  async update(id: number, dto: CreateMeterReadingDto, userId?: number) {
    const existing = await this.repo.findOne({ where: { id }, relations: ['items'] });
    if (!existing) throw new NotFoundException('Ghi chỉ số không tồn tại');
    if (userId && String(existing.createdBy) !== String(userId)) throw new ForbiddenException('Không có quyền sửa');

    existing.buildingId = dto.buildingId;
    existing.apartmentId = dto.apartmentId;
    existing.meterType = dto.meterType;
    existing.period = dto.period;
    existing.readingDate = dto.readingDate;

    console.log('[MeterReadingService.update] id=', id, 'payload=', JSON.stringify(dto));

    // Use a transaction to update parent and replace child items to avoid FK issues
    const result = await this.repo.manager.transaction(async (manager) => {
      // save parent (in case any parent fields changed)
      const savedParent = await manager.save(MeterReading, existing as any);

      // delete old items
      await manager.delete(MeterReadingItem, { meterReadingId: id } as any);

      let savedItems: any[] = [];
      if (dto.items && dto.items.length) {
        // prepare plain objects to insert with explicit meter_reading_id
        const plainItems = (dto.items || []).map((it) => ({
          meter_reading_id: id,
          name: it.name,
          previous_index: it.previousIndex ?? null,
          new_index: it.newIndex,
          reading_date: it.readingDate ?? null,
          images: it.images ?? null,
        }));

        // use insert to avoid relation resolution issues
        await manager.insert(MeterReadingItem, plainItems as any);

        // fetch inserted items
        savedItems = await manager.find(MeterReadingItem, { where: { meterReadingId: id } as any });
        console.log('[MeterReadingService.update] savedItems=', JSON.stringify(savedItems));
      }

      // attach items to parent for return
      (savedParent as any).items = savedItems;
      return savedParent;
    });

    return result;
  }

  async remove(id: number, userId?: number) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Ghi chỉ số không tồn tại');
    if (userId && String(existing.createdBy) !== String(userId)) throw new ForbiddenException('Không có quyền xoá');
    await this.repo.delete(id); // items will be removed by ON DELETE CASCADE
    return { deleted: true };
  }

  /**
   * Compute summary stats for a user: counts of notFinalized, reviewed, notReviewed and total consumption
   * Status priority (exclusive): if any item has reading_date IS NULL -> 'Chưa chốt'
   * otherwise if any item has images -> 'Đã duyệt' else 'Chưa duyệt'
   */
  async getStatsByUser(userId?: number) {
    if (!userId) return { notFinalized: 0, reviewed: 0, notReviewed: 0, totalConsumption: 0 };

    // count readings that have at least one item with reading_date IS NULL
    const notFinalizedRow: any = (await this.repo.query(
      `SELECT COUNT(DISTINCT mr.id) as cnt
       FROM meter_readings mr
       JOIN meter_reading_items it ON it.meter_reading_id = mr.id
       WHERE mr.created_by = ? AND it.reading_date IS NULL`,
      [userId],
    ))[0] || { cnt: 0 };

    const notFinalized = Number(notFinalizedRow.cnt || 0);

    // reviewed: no items with NULL reading_date AND at least one item with images not null/empty
    const reviewedRow: any = (await this.repo.query(
      `SELECT COUNT(DISTINCT mr.id) as cnt
       FROM meter_readings mr
       WHERE mr.created_by = ?
         AND NOT EXISTS (SELECT 1 FROM meter_reading_items it WHERE it.meter_reading_id = mr.id AND it.reading_date IS NULL)
         AND EXISTS (SELECT 1 FROM meter_reading_items it2 WHERE it2.meter_reading_id = mr.id AND it2.images IS NOT NULL AND it2.images <> '[]')`,
      [userId],
    ))[0] || { cnt: 0 };

    const reviewed = Number(reviewedRow.cnt || 0);

    // notReviewed: no NULL reading_date and no images
    const notReviewedRow: any = (await this.repo.query(
      `SELECT COUNT(DISTINCT mr.id) as cnt
       FROM meter_readings mr
       WHERE mr.created_by = ?
         AND NOT EXISTS (SELECT 1 FROM meter_reading_items it WHERE it.meter_reading_id = mr.id AND it.reading_date IS NULL)
         AND NOT EXISTS (SELECT 1 FROM meter_reading_items it2 WHERE it2.meter_reading_id = mr.id AND it2.images IS NOT NULL AND it2.images <> '[]')`,
      [userId],
    ))[0] || { cnt: 0 };

    const notReviewed = Number(notReviewedRow.cnt || 0);

    // total consumption: sum over items (new_index - coalesce(previous_index,0))
    const totalRow: any = (await this.repo.query(
      `SELECT COALESCE(SUM((COALESCE(CAST(it.new_index AS DECIMAL(18,4)),0) - COALESCE(CAST(it.previous_index AS DECIMAL(18,4)),0))),0) as total
       FROM meter_readings mr
       JOIN meter_reading_items it ON it.meter_reading_id = mr.id
       WHERE mr.created_by = ?`,
      [userId],
    ))[0] || { total: 0 };

    const totalConsumption = Number(totalRow.total || 0);

    return { notFinalized, reviewed, notReviewed, totalConsumption };
  }

  /**
   * Set approved flag by adding/removing a marker in items.images.
   * Using images field as a lightweight marker to avoid DB schema migration.
   */
  async setApproval(id: number, userId: number | undefined, approve: boolean) {
    const existing = await this.repo.findOne({ where: { id }, relations: ['items'] });
    if (!existing) throw new NotFoundException('Ghi chỉ số không tồn tại');
    if (userId && String(existing.createdBy) !== String(userId)) throw new ForbiddenException('Không có quyền');

    const items = (existing as any).items || [];
    for (const it of items) {
      if (approve) {
        // set a simple marker if images empty
        if (!it.images || (Array.isArray(it.images) && it.images.length === 0)) it.images = ['__approved__'];
      } else {
        // remove marker values; if images only contains our marker, clear to null
        if (Array.isArray(it.images) && it.images.length === 1 && it.images[0] === '__approved__') it.images = null;
      }
    }

    if (items.length) {
      await this.itemRepo.save(items as any);
    }

    // return updated entity
    const updated = await this.repo.findOne({ where: { id }, relations: ['items'] });
    return updated;
  }
}
