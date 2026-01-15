import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'bank_accounts' })
export class BankAccount {
  @PrimaryGeneratedColumn()
  id!: number;

  /** Chủ tài khoản (họ tên) */
  @Column({ length: 160 })
  accountHolder!: string;

  /** Số tài khoản */
  @Index()
  @Column({ length: 64 })
  accountNumber!: string;

  /** Ngân hàng (VD: Vietcombank, MB...) */
  @Column({ length: 120 })
  bankName!: string;

  /** Chi nhánh/phòng giao dịch (tuỳ chọn) */
  @Column({ length: 160, nullable: true })
  branch?: string | null;

  /** Ghi chú (tuỳ chọn) */
  @Column({ type: 'text', nullable: true })
  note?: string | null;

  /** Đặt làm mặc định để hiển thị ưu tiên */
  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  /** Chủ sở hữu (chủ nhà) */
  @Index()
  @Column()
  ownerId!: number;

  /** Số dư hiện tại (chủ nhà có thể nhập) */
  @Column({ type: 'decimal', precision: 14, scale: 2, default: '0' })
  balance!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
