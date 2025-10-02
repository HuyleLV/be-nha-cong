import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index
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

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  // ====== Referral / Affiliate ======
  @Index({ unique: true })
  @Column({ length: 50, unique: true, nullable: true })
  referralCode: string;

  @Column({ length: 50, nullable: true })
  referralBy?: string; 

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, nullable: true })
  rewardBalance: number;

  @Column({ type: 'enum', enum: UserRole, nullable: true })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
