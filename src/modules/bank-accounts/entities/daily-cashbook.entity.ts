import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'daily_cashbook' })
export class DailyCashbook {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'date' })
  date!: string; // YYYY-MM-DD

  @Index()
  @Column({ nullable: true })
  ownerId?: number | null;

  @Index()
  @Column({ nullable: true })
  accountId?: number | null;

  @Column({ length: 300 })
  accountLabel!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: '0' })
  startingBalance!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: '0' })
  totalThu!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: '0' })
  totalChi!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: '0' })
  endingBalance!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
