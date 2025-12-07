import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ServiceFeeType {
  RENT = 'rent',
  DEPOSIT = 'deposit',
  WATER = 'water',
  ELECTRIC = 'electric',
  INTERNET = 'internet',
  SERVICE = 'service_fee',
  OTHER = 'other',
}

export enum ServicePriceType {
  FIXED = 'fixed',
  PER_UNIT = 'per_unit',
  PERCENT = 'percent',
  METER_FIXED = 'meter_fixed',
  METER_QUOTA = 'meter_quota',
  QUANTITY_QUOTA = 'quantity_quota',
}

export enum ServiceUnit {
  PHONG = 'phong',
  GIUONG = 'giuong',
  KWH = 'kwh',
  M3 = 'm3',
  M2 = 'm2',
  XE = 'xe',
  LUOT = 'luot',
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'fee_type', length: 40, nullable: true })
  @Index()
  feeType?: ServiceFeeType | null;

  @Column({ name: 'price_type', length: 40, nullable: true })
  priceType?: ServicePriceType | null;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  unitPrice?: string | null;

  @Column({ name: 'unit', length: 40, nullable: true })
  unit?: string | null;

  @Column({ name: 'building_id', type: 'int', nullable: true })
  buildingId?: number | null;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdById?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
