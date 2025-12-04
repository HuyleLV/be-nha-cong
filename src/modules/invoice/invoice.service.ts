import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

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

    if (dto.items?.length) {
      const items = dto.items.map((it) => this.itemRepo.create({
        invoiceId: (saved as any).id,
        invoice: saved as any,
        serviceName: it.serviceName,
        unitPrice: it.unitPrice ?? null,
        meterIndex: it.meterIndex ?? null,
        quantity: it.quantity ?? null,
        vat: it.vat ?? null,
        fromDate: it.fromDate ? new Date(it.fromDate) : null,
        toDate: it.toDate ? new Date(it.toDate) : null,
        amount: it.amount ?? null,
      }));
      const savedItems = await this.itemRepo.save(items);
      (saved as any).items = savedItems;
    } else {
      (saved as any).items = [];
    }

    return saved;
  }

  async listByUser(userId: number) {
    return this.repo.find({ where: { createdBy: userId }, relations: ['items'], order: { id: 'DESC' } });
  }

  async getOne(id: number, userId?: number) {
    const found = await this.repo.findOne({ where: { id }, relations: ['items'] });
    if (!found) throw new NotFoundException('Hóa đơn không tồn tại');
    if (userId && String(found.createdBy) !== String(userId)) throw new ForbiddenException('Không có quyền truy cập');
    return found;
  }

  async update(id: number, dto: CreateInvoiceDto, userId?: number) {
    const existing = await this.repo.findOne({ where: { id }, relations: ['items'] });
    if (!existing) throw new NotFoundException('Hóa đơn không tồn tại');
    if (userId && String(existing.createdBy) !== String(userId)) throw new ForbiddenException('Không có quyền sửa');

    existing.buildingId = dto.buildingId;
    existing.apartmentId = dto.apartmentId;
    existing.contractId = dto.contractId ?? null;
    existing.period = dto.period;
    existing.issueDate = dto.issueDate ? new Date(dto.issueDate) : null;
    existing.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    existing.printTemplate = dto.printTemplate ?? null;
    existing.note = dto.note ?? null;

    const result = await this.repo.manager.transaction(async (manager) => {
      const savedParent = await manager.save(Invoice, existing as any);
      await manager.delete(InvoiceItem, { invoiceId: id } as any);

      let savedItems: any[] = [];
      if (dto.items?.length) {
        const plainItems = dto.items.map((it) => ({
          invoice_id: id,
          service_name: it.serviceName,
          unit_price: it.unitPrice ?? null,
          meter_index: it.meterIndex ?? null,
          quantity: it.quantity ?? null,
          vat: it.vat ?? null,
          from_date: it.fromDate ? new Date(it.fromDate) : null,
          to_date: it.toDate ? new Date(it.toDate) : null,
          amount: it.amount ?? null,
        }));
        await manager.insert(InvoiceItem, plainItems as any);
        savedItems = await manager.find(InvoiceItem, { where: { invoiceId: id } as any });
      }

      (savedParent as any).items = savedItems;
      return savedParent;
    });

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
