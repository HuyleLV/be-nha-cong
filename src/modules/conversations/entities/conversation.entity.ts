import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'conversations' })
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  // Owner (chủ nhà)
  @ManyToOne(() => User, { eager: true })
  owner: User;

  // Other participant (khách hàng)
  @ManyToOne(() => User, { eager: true })
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  lastMessageText?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt?: Date | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  lastMessageFrom?: User | null;
}
