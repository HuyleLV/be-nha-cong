import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique, ManyToOne, JoinColumn } from 'typeorm';

export type OwnershipRole = 'owner' | 'manager' | 'editor' | 'viewer';

@Entity('ownerships')
@Unique(['userId', 'buildingId']) // 1 user không có 2 dòng cho cùng 1 building
export class Ownership {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'building_id' })
  buildingId: number;

  @Column({ type: 'enum', enum: ['owner','manager','editor','viewer'], default: 'owner' })
  role: OwnershipRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
