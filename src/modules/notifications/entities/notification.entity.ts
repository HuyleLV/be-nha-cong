import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'text', nullable: true })
  attachments: string | null;

  @Column({ name: 'recipient_type', length: 32, nullable: true })
  recipientType: 'building' | 'apartment' | null;

  @Column({ name: 'building_id', type: 'int', nullable: true })
  buildingId: number | null;

  @Column({ name: 'apartment_id', type: 'int', nullable: true })
  apartmentId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
