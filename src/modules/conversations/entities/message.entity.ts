import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'messages' })
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  conversation: Conversation;

  @ManyToOne(() => User, { eager: true })
  from: User;

  // receiver (to) - convenient denormalization for quick queries
  @ManyToOne(() => User, { eager: true })
  to: User;

  @Column({ type: 'text' })
  text: string;

  // Optional attachments: array of uploaded file URLs or metadata stored as JSON
  @Column({ type: 'json', nullable: true })
  attachments?: any[] | null;

  // Optional icon/emoji for the message
  @Column({ type: 'varchar', length: 64, nullable: true })
  icon?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
