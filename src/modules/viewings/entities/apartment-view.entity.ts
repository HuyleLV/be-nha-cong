import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('apartment_views')
@Index(['userId', 'apartmentId'], { unique: true })
export class ApartmentView {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  apartmentId: number;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
