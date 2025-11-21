import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type BedStatus = 'active' | 'inactive' | 'draft';

@Entity('beds')
export class Bed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 180 })
  name: string;

  @Column({ name: 'rent_price', type: 'numeric', precision: 12, scale: 2 })
  rentPrice: string;

  @Column({ name: 'deposit_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  depositAmount?: string | null;

  @Column({ name: 'apartment_id', type: 'int', nullable: true })
  apartmentId?: number | null;

  @Column({ length: 20, default: 'active' })
  status: BedStatus;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdById?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
