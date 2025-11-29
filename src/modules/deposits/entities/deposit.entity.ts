import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';

export enum DepositStatus {
  PENDING = 'pending', // chờ ký hợp đồng
  SIGNED = 'signed', // đã ký hợp đồng
  CANCELLED = 'cancelled', // bỏ cọc
}

@Entity({ name: 'deposits' })
export class Deposit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: DepositStatus, default: DepositStatus.PENDING })
  status: DepositStatus;

  @Column({ nullable: true })
  buildingId?: number;

  @Column({ nullable: true })
  apartmentId?: number;

  // reference to user who made deposit
  @Column({ nullable: true })
  customerId?: number;

  // snapshot of customer info (name/phone/email) to keep history
  @Column({ type: 'text', nullable: true })
  customerInfo?: string;

  @Column({ nullable: true })
  occupantsCount?: number;

  @Column({ nullable: true })
  rentAmount?: number;

  @Column({ nullable: true })
  depositAmount?: number;

  @Column({ nullable: true })
  depositDate?: Date;

  @Column({ nullable: true })
  moveInDate?: Date;

  @Column({ nullable: true })
  billingStartDate?: Date;

  @Column({ length: 120, nullable: true })
  contractDuration?: string;

  @Column({ type: 'date', nullable: true })
  rentFrom?: Date;

  @Column({ type: 'date', nullable: true })
  rentTo?: Date;

  @Column({ length: 80, nullable: true })
  paymentCycle?: string;

  @Column({ length: 255, nullable: true })
  account?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  // store attachments as JSON array of file urls
  @Column({ type: 'text', nullable: true })
  attachments?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
