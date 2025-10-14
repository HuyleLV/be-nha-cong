import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
    UpdateDateColumn
  } from 'typeorm';

@Entity({ name: 'blog' })
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 180, nullable: true })
  @Index()
  title: string;

  @Column({ length: 200, unique: true, nullable: true })
  slug: string;
  
  @Column({ type: 'text', nullable: true })
  excerpt?: string;

  @Column({ type: 'longtext', nullable: true })
  content: string;

  @Column({ length: 500, nullable: true })
  coverImageUrl?: string;

  @Column({ nullable: true })
  status: number;

  @Column({ default: false, nullable: true })
  isPinned: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'int', default: 0, nullable: true })
  viewCount: number;

  @Column({ type: 'int', default: 0, nullable: true })
  pointSeo: number;
  
  @Column({ length: 200, nullable: true })
  focusKeyword: string;

  @Column({ nullable: true })
  authorId?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
