import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('point_transactions')
export class PointTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'int' })
    amount: number; // Positive for earning, negative for spending

    @Column({ length: 50, nullable: true })
    type: string; // e.g., 'earn_payment', 'redeem_offer', 'manual_adjust'

    @Column({ length: 255, nullable: true })
    description: string;

    @Column({ name: 'created_by', nullable: true })
    createdBy?: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
