import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Job } from './job.entity';

@Entity('job_applications')
export class JobApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  jobId: number;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'jobId' })
  job?: Job;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  // URL or relative path to uploaded CV file (pdf/doc)
  @Column({ type: 'varchar', length: 500, nullable: true })
  cvUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  message?: string | null;

  // Trạng thái xử lý: new (mới), reviewed (đã xem), contacted (đã liên hệ), rejected (từ chối)
  @Index()
  @Column({ type: 'varchar', length: 20, default: 'new' })
  status: string;

  // Ghi chú nội bộ cho HR
  @Column({ type: 'text', nullable: true })
  internalNote?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
