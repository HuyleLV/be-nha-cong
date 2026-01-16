import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InvoiceItem } from './invoice-item.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'building_id', type: 'int' })
  buildingId: number;

  @Column({ name: 'apartment_id', type: 'int' })
  apartmentId: number;

  @Column({ name: 'contract_id', type: 'int', nullable: true })
  contractId: number | null;

  @Column({ name: 'period', type: 'varchar', length: 7 }) // YYYY-MM
  period: string;

  @Column({ name: 'issue_date', type: 'date', nullable: true })
  issueDate: Date | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'print_template', type: 'varchar', length: 100, nullable: true })
  printTemplate: string | null;

  @Column({ name: 'note', type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy: number | null;

  @Column({ name: 'total_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: string;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 14, scale: 2, default: 0 })
  paidAmount: string;

  @Column({ name: 'payment_date', type: 'datetime', nullable: true })
  paymentDate: Date | null;

  @Column({ type: 'enum', enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'], default: 'draft' })
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

  @OneToMany(() => InvoiceItem, (it: InvoiceItem) => it.invoice, { cascade: true })
  items: InvoiceItem[];
}
