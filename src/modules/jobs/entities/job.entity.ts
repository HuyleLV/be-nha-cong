import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type JobStatus = 'draft' | 'published' | 'archived';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  @Index()
  title: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'text', nullable: true })
  requirements?: string | null;

  @Column({ type: 'text', nullable: true })
  benefits?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  location?: string | null; // ví dụ: Ha Noi / Remote

  @Column({ type: 'varchar', length: 60, nullable: true })
  employmentType?: string | null; // Full-time / Part-time / Intern

  @Column({ type: 'varchar', length: 60, nullable: true })
  level?: string | null; // Junior / Senior / Lead

  @Column({ type: 'int', nullable: true })
  salaryMin?: number | null;

  @Column({ type: 'int', nullable: true })
  salaryMax?: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency?: string | null; // VND / USD

  // Ảnh đại diện/cover cho tin tuyển dụng (đường dẫn tương đối hoặc URL tuyệt đối)
  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImageUrl?: string | null;

  // Ảnh bìa lớn hiển thị ở trang chi tiết (hero). Tách khỏi ảnh đại diện dùng ở listing.
  @Column({ type: 'varchar', length: 500, nullable: true })
  bannerImageUrl?: string | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: JobStatus;

  @Column({ type: 'datetime', nullable: true })
  publishedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ===== Applications relation will be added later (one-to-many) =====
}
