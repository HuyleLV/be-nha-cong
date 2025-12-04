import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
// import type to avoid circular type resolution at runtime
import type { MeterReading } from './meter-reading.entity';

@Entity('meter_reading_items')
export class MeterReadingItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'meter_reading_id', type: 'int' })
  meterReadingId: number;

  // use require() in the relation callback to avoid circular import issues
  @ManyToOne(() => (require('./meter-reading.entity') as any).MeterReading, (m: any) => m.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meter_reading_id' })
  meterReading: any;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'previous_index', type: 'numeric', precision: 12, scale: 2, nullable: true })
  previousIndex?: string | null;

  @Column({ name: 'new_index', type: 'numeric', precision: 12, scale: 2 })
  newIndex: string;

  @Column({ name: 'reading_date', type: 'date', nullable: true })
  readingDate?: string | null;

  @Column({ name: 'images', type: 'simple-json', nullable: true })
  images?: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
