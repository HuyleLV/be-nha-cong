import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired' | 'draft';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 120, nullable: true })
  brand?: string | null;

  @Column({ length: 50, nullable: true })
  color?: string | null;

  @Column({ name: 'model_or_year', length: 80, nullable: true })
  modelOrYear?: string | null;

  @Column({ length: 120, nullable: true })
  origin?: string | null;

  @Column({ name: 'value', type: 'numeric', precision: 14, scale: 2, default: 0 })
  value: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ length: 20, default: 'available' })
  status: AssetStatus;

  @Column({ name: 'building_id', type: 'int', nullable: true })
  buildingId?: number | null;

  @Column({ name: 'apartment_id', type: 'int', nullable: true })
  apartmentId?: number | null;

  @Column({ name: 'bed_id', type: 'int', nullable: true })
  bedId?: number | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'text', nullable: true })
  images?: string | null; // could be JSON array or comma-separated

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdById?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
