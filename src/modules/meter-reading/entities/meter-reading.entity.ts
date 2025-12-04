import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MeterReadingItem } from './meter-reading-item.entity';

export type MeterType = 'electricity' | 'water';

@Entity('meter_readings')
export class MeterReading {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'building_id', type: 'int' })
  buildingId: number;

  @Column({ name: 'apartment_id', type: 'int' })
  apartmentId: number;

  @Column({ name: 'meter_type', type: 'enum', enum: ['electricity', 'water'] })
  meterType: MeterType;

  // period as YYYY-MM
  @Column({ length: 7 })
  period: string;

  @Column({ name: 'reading_date', type: 'date' })
  readingDate: string;

  @OneToMany(() => MeterReadingItem, (it) => it.meterReading, { cascade: true })
  items: MeterReadingItem[];

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
