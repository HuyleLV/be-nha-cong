import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ThuChi } from './thu-chi.entity';

@Entity('thu_chi_items')
export class ThuChiItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'thu_chi_id', type: 'int' })
  thuChiId: number;

  @ManyToOne(() => ThuChi, (tc) => tc.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thu_chi_id' })
  thuChi: ThuChi;

  @Column({ name: 'category', type: 'varchar', length: 200 })
  category: string;

  @Column({ name: 'amount', type: 'decimal', precision: 14, scale: 2, nullable: true })
  amount: string | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;
}
