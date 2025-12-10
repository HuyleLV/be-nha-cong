import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice) private readonly repo: Repository<Invoice>,
    @InjectRepository(InvoiceItem) private readonly itemRepo: Repository<InvoiceItem>,
  ) {}

  async create(dto: CreateInvoiceDto, userId?: number) {
    const parent = this.repo.create({
      buildingId: dto.buildingId,
      apartmentId: dto.apartmentId,
      contractId: dto.contractId ?? null,
      period: dto.period,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      printTemplate: dto.printTemplate ?? null,
      note: dto.note ?? null,
      createdBy: userId ?? null,
    } as any);
  const saved = await this.repo.save(parent as any) as unknown as Invoice;

    const norm = (v: any) => (v === '' ? null : (v ?? null));

    if (dto.items?.length) {
      const items = dto.items.map((it) => this.itemRepo.create({
        invoiceId: (saved as any).id,
        invoice: saved as any,
        serviceName: it.serviceName,
        unitPrice: norm(it.unitPrice),
        meterIndex: norm(it.meterIndex),
        quantity: norm(it.quantity),
        vat: norm(it.vat),
        fromDate: it.fromDate ? new Date(it.fromDate) : null,
        toDate: it.toDate ? new Date(it.toDate) : null,
        amount: norm(it.amount),
      }));
      const savedItems = await this.itemRepo.save(items);
      (saved as any).items = savedItems;
    } else {
      (saved as any).items = [];
    }

    return saved;
  }

  async listByUser(userId: number, params?: any) {
    const qb = this.repo.createQueryBuilder('inv').leftJoinAndSelect('inv.items', 'it')
      .where('inv.created_by = :uid', { uid: userId })
      .orderBy('inv.id', 'DESC');

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

  async getOne(id: number, userId?: number) {
    const found = await this.repo.findOne({ where: { id }, relations: ['items'] });
    if (!found) throw new NotFoundException('Hóa đơn không tồn tại');
    if (userId && String(found.createdBy) !== String(userId)) throw new ForbiddenException('Không có quyền truy cập');
    return found;
  }

  async update(id: number, dto: UpdateInvoiceDto, userId?: number) {
    const existing = await this.repo.findOne({ where: { id }, relations: ['items'] });
    if (!existing) throw new NotFoundException('Hóa đơn không tồn tại');
    if (userId && String(existing.createdBy) !== String(userId)) throw new ForbiddenException('Không có quyền sửa');

    // Only overwrite fields that are present in the DTO (support partial updates)
    if ((dto as any).buildingId !== undefined) existing.buildingId = dto.buildingId as any;
    if ((dto as any).apartmentId !== undefined) existing.apartmentId = dto.apartmentId as any;
    if (((dto as any).contractId !== undefined)) existing.contractId = (((dto as any).contractId === '') ? null : (dto.contractId ?? null)) as any;
    if ((dto as any).period !== undefined) existing.period = dto.period as any;
    if ((dto as any).issueDate !== undefined) existing.issueDate = dto.issueDate ? new Date(dto.issueDate) : null;
    if ((dto as any).dueDate !== undefined) existing.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if ((dto as any).printTemplate !== undefined) existing.printTemplate = dto.printTemplate ?? null;
    if ((dto as any).note !== undefined) existing.note = dto.note ?? null;

    let result: any;
    try {
      result = await this.repo.manager.transaction(async (manager) => {
      const savedParent = await manager.save(Invoice, existing as any);

      let savedItems: any[] = [];
      // Only replace items if items are present in DTO (allow partial update without touching items)
      if ((dto as any).items !== undefined) {
        await manager.delete(InvoiceItem, { invoiceId: id } as any);
        if (Array.isArray(dto.items) && dto.items.length) {
          const norm2 = (v: any) => (v === '' ? null : (v ?? null));
          const plainItems = (dto.items as any[]).map((it) => ({
            invoiceId: id,
            serviceName: it.serviceName,
            unitPrice: norm2(it.unitPrice),
            meterIndex: norm2(it.meterIndex),
            quantity: norm2(it.quantity),
            vat: norm2(it.vat),
            fromDate: it.fromDate ? new Date(it.fromDate) : null,
            toDate: it.toDate ? new Date(it.toDate) : null,
            amount: norm2(it.amount),
          }));
          await manager.insert(InvoiceItem, plainItems as any);
          savedItems = await manager.find(InvoiceItem, { where: { invoiceId: id } as any });
        }
      } else {
        // keep existing items
        savedItems = await manager.find(InvoiceItem, { where: { invoiceId: id } as any });
      }

      (savedParent as any).items = savedItems;
      return savedParent;
    });
    } catch (err) {
      // Log the incoming DTO and the error for easier debugging
      console.error('[InvoiceService][update] failed to update invoice id=', id, 'dto=', {
        buildingId: dto.buildingId,
        apartmentId: dto.apartmentId,
        contractId: dto.contractId,
        period: dto.period,
        issueDate: dto.issueDate,
        dueDate: dto.dueDate,
        printTemplate: dto.printTemplate,
        note: dto.note,
        itemsCount: Array.isArray(dto.items) ? dto.items.length : undefined,
      }, 'error=', err);
      throw err;
    }

    return result;
  }

  async remove(id: number, userId?: number) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Hóa đơn không tồn tại');
    if (userId && String(existing.createdBy) !== String(userId)) throw new ForbiddenException('Không có quyền xoá');
    await this.repo.delete(id);
    return { deleted: true };
  }
}
