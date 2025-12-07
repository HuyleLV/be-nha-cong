import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum PriorityLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high'
}

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  buildingId: number | null;

  @Column({ nullable: true })
  apartmentId: number | null;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ nullable: true })
  group: string | null;

  @Column({ nullable: true })
  type: string | null;

  @Column({ type: 'enum', enum: PriorityLevel, default: PriorityLevel.NORMAL })
  priority: PriorityLevel;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ nullable: true })
  assignee: string | null;

  @Column({ type: 'text', nullable: true })
  attachments: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
