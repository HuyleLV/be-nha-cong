import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  // optional amount for some report types
  @Column({ name: 'amount', type: 'bigint', nullable: true })
  amount?: number | null;

  @Column({ name: 'type', length: 64, nullable: true })
  type?: string | null; // e.g. warranty, repair, fire, complaint

  @Column({ name: 'reported_at', type: 'datetime', nullable: true })
  reportedAt?: Date | null;

  @Column({ name: 'status', length: 64, nullable: true })
  status?: string | null;

  @Column({ name: 'building_id', type: 'int', nullable: true })
  @Index()
  buildingId?: number | null;

  @Column({ name: 'apartment_id', type: 'int', nullable: true })
  @Index()
  apartmentId?: number | null;

  @Column({ name: 'customer_id', type: 'int', nullable: true })
  @Index()
  customerId?: number | null;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
