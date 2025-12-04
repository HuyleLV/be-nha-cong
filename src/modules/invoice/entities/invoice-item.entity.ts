import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'invoice_id', type: 'int' })
  invoiceId: number;

  @ManyToOne(() => Invoice, (inv) => inv.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ name: 'service_name', type: 'varchar', length: 200 })
  serviceName: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  unitPrice: string | null;

  @Column({ name: 'meter_index', type: 'decimal', precision: 12, scale: 2, nullable: true })
  meterIndex: string | null;

  @Column({ name: 'quantity', type: 'decimal', precision: 12, scale: 2, nullable: true })
  quantity: string | null;

  @Column({ name: 'vat', type: 'decimal', precision: 5, scale: 2, nullable: true })
  vat: string | null;

  @Column({ name: 'from_date', type: 'date', nullable: true })
  fromDate: Date | null;

  @Column({ name: 'to_date', type: 'date', nullable: true })
  toDate: Date | null;

  @Column({ name: 'amount', type: 'decimal', precision: 14, scale: 2, nullable: true })
  amount: string | null;
}
