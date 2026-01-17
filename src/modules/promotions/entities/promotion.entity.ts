import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('promotions')
export class Promotion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    code: string;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ length: 20 }) // 'fixed' or 'percent'
    type: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    value: number; // Amount or Percentage

    @Column({ name: 'max_uses', type: 'int', nullable: true })
    maxUses?: number;

    @Column({ name: 'used_count', type: 'int', default: 0 })
    usedCount: number;

    @Column({ name: 'start_date', type: 'datetime', nullable: true })
    startDate?: Date;

    @Column({ name: 'end_date', type: 'datetime', nullable: true })
    endDate?: Date;

    @Column({ default: true })
    active: boolean;

    @Column({ name: 'created_by', nullable: true })
    createdBy?: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
