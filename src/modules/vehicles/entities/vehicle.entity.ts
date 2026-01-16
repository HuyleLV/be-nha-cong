import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 64, nullable: true })
  type?: string | null; // e.g. oto, xe_may

  @Column({ length: 255, nullable: true })
  model?: string | null; // tên dòng xe

  @Column({ length: 64, nullable: true })
  color?: string | null;

  @Column({ name: 'plate_number', length: 64, nullable: true })
  plateNumber?: string | null;

  @Column({ name: 'owner_name', length: 255, nullable: true })
  ownerName?: string | null;

  @Column({ name: 'ticket_number', length: 128, nullable: true })
  ticketNumber?: string | null;

  @Column({ name: 'building_id', type: 'int', nullable: true })
  @Index()
  buildingId?: number | null;

  @Column({ name: 'apartment_id', type: 'int', nullable: true })
  @Index()
  apartmentId?: number | null;

  @Column({ name: 'customer_id', type: 'int', nullable: true })
  @Index()
  customerId?: number | null;

  @Column({ name: 'photo', length: 255, nullable: true })
  photo?: string | null;

  // New fields ported from nhacong-pro
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  slug?: string | null;

  @Column({ name: 'approval_status', type: 'varchar', length: 50, nullable: true, default: 'approved' })
  approvalStatus?: string | null;

  @Column({ name: 'is_approved', type: 'boolean', default: true })
  isApproved?: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: true })
  isVerified?: boolean;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'available' })
  status: string;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
