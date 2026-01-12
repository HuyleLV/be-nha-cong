import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum UserRole {
  CUSTOMER = 'customer', // khách hàng
  OWNER = 'host',       // chủ nhà
  ADMIN = 'admin',       // quản trị
}

export enum CustomerStatus {
  NEW = 'new',
  APPOINTMENT = 'appointment',
  SALES = 'sales',
  DEPOSIT_FORM = 'deposit_form',
  CONTRACT = 'contract',
  FAILED = 'failed',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120, nullable: true })
  name: string;

  @Column({ length: 160, unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  passwordHash?: string;

  // Lưu ở dạng chuẩn hoá +84XXXXXXXXX để tránh trùng (0xxx và +84xxx)
  @Column({ length: 20, nullable: true })
  phone?: string; // TODO: Sau khi clean dữ liệu cũ, thêm unique index để ngăn trùng

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ length: 500, nullable: true })
  idCardFront?: string;

  @Column({ length: 500, nullable: true })
  idCardBack?: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  /** Xác thực email (DB lưu cột email_verified: 1 = đã xác thực, 0 = chưa) */
  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  /** Mã OTP xác thực email (tạm thời) */
  @Column({ type: 'varchar', length: 12, nullable: true })
  emailVerificationCode?: string | null;

  /** Hạn dùng của OTP xác thực */
  @Column({ type: 'datetime', nullable: true })
  emailVerificationExpires?: Date | null;

  /** Xác thực số điện thoại (DB lưu cột phone_verified: 1 = đã xác thực, 0 = chưa) */
  @Column({ name: 'phone_verified', type: 'boolean', default: false })
  phoneVerified?: boolean;

  /** Mã OTP xác thực số điện thoại */
  @Column({ type: 'varchar', length: 12, nullable: true })
  phoneVerificationCode?: string | null;

  /** Hạn dùng của OTP xác thực số điện thoại */
  @Column({ type: 'datetime', nullable: true })
  phoneVerificationExpires?: Date | null;

  /** Token đặt lại mật khẩu (tạm thời) */
  @Column({ type: 'varchar', length: 128, nullable: true })
  passwordResetToken?: string | null;

  /** Hạn dùng của token đặt lại mật khẩu */
  @Column({ type: 'datetime', nullable: true })
  passwordResetExpires?: Date | null;

  // ====== Referral / Affiliate ======
  @Column({ length: 50, unique: true, nullable: true })
  referralCode: string;

  @Column({ length: 50, nullable: true })
  referralBy?: string; 

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true })
  rewardBalance: number;

  @Column({ type: 'enum', enum: UserRole, nullable: true })
  role: UserRole;

  /** Người dùng có là CTV không (cộng tác viên) */
  @Column({ name: 'is_ctv', type: 'boolean', default: false })
  isCtv?: boolean;

  /** OAuth provider info */
  @Column({ length: 50, nullable: true, default: 'local' })
  provider?: string | null; // 'local' | 'google' | 'facebook' ...

  @Index()
  @Column({ length: 255, nullable: true })
  providerId?: string | null; // e.g., Google sub

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Nếu user này là khách hàng được quản lý bởi một chủ nhà, lưu ownerId
  @Index()
  @Column({ nullable: true })
  ownerId?: number;

  @Column({ length: 50, nullable: true })
  idCardNumber?: string;

  @Column({ type: 'date', nullable: true })
  idIssueDate?: Date;

  @Column({ length: 255, nullable: true })
  idIssuePlace?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'enum', enum: CustomerStatus, nullable: true })
  customerStatus?: CustomerStatus;
}
