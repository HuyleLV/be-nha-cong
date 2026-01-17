import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ContractStatus {
  ACTIVE = 'active',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'building_id', nullable: true })
  @Index()
  buildingId?: number | null;

  @Column({ name: 'apartment_id', nullable: true })
  @Index()
  apartmentId?: number | null;

  @Column({ name: 'sign_date', type: 'datetime', nullable: true })
  signDate?: Date | null;

  @Column({ name: 'start_date', type: 'datetime', nullable: true })
  startDate?: Date | null;

  @Column({ name: 'expiry_date', type: 'datetime', nullable: true })
  expiryDate?: Date | null;

  @Column({ name: 'invoice_template', length: 255, nullable: true })
  invoiceTemplate?: string | null;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @Column({ name: 'customer_id', nullable: true })
  @Index()
  customerId?: number | null;

  @Column({ name: 'rent_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  rentAmount?: string | null;

  @Column({ name: 'promotion_code', length: 50, nullable: true })
  promotionCode?: string | null;

  // Stored discount/promotion info at time of signing
  @Column({ name: 'promotion_value', type: 'decimal', precision: 12, scale: 2, nullable: true })
  promotionValue?: number | null;

  @Column({ name: 'promotion_type', length: 20, nullable: true })
  promotionType?: string | null;

  @Column({ name: 'payment_cycle', length: 32, nullable: true })
  paymentCycle?: string | null; // e.g. monthly, quarterly

  @Column({ name: 'billing_start_date', type: 'datetime', nullable: true })
  billingStartDate?: Date | null;

  @Column({ name: 'deposit_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  depositAmount?: string | null;

  @Column({ name: 'deposit_paid', type: 'decimal', precision: 12, scale: 2, default: 0 })
  depositPaid: string;

  @Column({ name: 'attachments', type: 'simple-json', nullable: true })
  attachments?: string[] | null;

  @Column({ name: 'service_fees', type: 'simple-json', nullable: true })
  serviceFees?: any[] | null;

  @Column({ name: 'commission_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  commissionAmount: string;

  @Column({ name: 'commission_status', type: 'enum', enum: ['pending', 'paid'], default: 'pending' })
  commissionStatus: 'pending' | 'paid';

  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.ACTIVE })
  status: ContractStatus;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
