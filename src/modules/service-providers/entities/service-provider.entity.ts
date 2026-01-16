import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum ServiceProviderStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending',
}

export enum ServiceType {
    DIEN = 'dien', // Điện
    NUOC = 'nuoc', // Nước
    SUA_CHUA = 'sua_chua', // Sửa chữa
    VE_SINH = 've_sinh', // Vệ sinh
    SON = 'son', // Sơn
    LAP_DAT = 'lap_dat', // Lắp đặt
    NOI_THAT = 'noi_that', // Nội thất
    KHAC = 'khac', // Khác
}

@Entity('service_providers')
export class ServiceProvider {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    @Index()
    name: string;

    @Column({ type: 'varchar', length: 220, unique: true, nullable: true })
    slug?: string | null; // Slug for SEO-friendly URLs

    @Column({
        type: 'enum',
        enum: ServiceType,
        default: ServiceType.KHAC,
    })
    @Index()
    serviceType: ServiceType;

    @Column({ length: 20 })
    @Index()
    phone: string;

    @Column({ length: 255, nullable: true })
    email?: string | null;

    @Column({ name: 'location_id', type: 'int', nullable: true })
    @Index()
    locationId?: number | null;

    @Column({ length: 255, nullable: true })
    address?: string | null;

    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    rating?: string | null; // 0.00 - 5.00

    @Column({ type: 'int', default: 0 })
    reviews: number; // Số lượng reviews

    @Column({ name: 'avatar_url', type: 'text', nullable: true })
    avatarUrl?: string | null;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({
        name: 'price_from',
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
    })
    priceFrom?: string | null; // Giá từ (VND)

    @Column({
        name: 'price_to',
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
    })
    priceTo?: string | null; // Giá đến (VND)

    @Column({
        type: 'enum',
        enum: ServiceProviderStatus,
        default: ServiceProviderStatus.ACTIVE,
    })
    @Index()
    status: ServiceProviderStatus;

    @Column({ name: 'is_verified', type: 'bool', default: false })
    isVerified: boolean; // Đã được xác minh

    // Approval workflow fields
    @Column({ name: 'approval_status', type: 'varchar', length: 50, nullable: true })
    @Index()
    approvalStatus?: 'pending' | 'approved' | 'rejected' | 'under_review' | 'needs_revision' | null;

    @Column({ type: 'int', nullable: true, default: 0 })
    priority?: number | null; // -100 to 100

    @Column({ name: 'approval_note', type: 'text', nullable: true })
    approvalNote?: string | null;

    @Column({ name: 'is_approved', type: 'boolean', default: false })
    @Index()
    isApproved?: boolean;

    @Column({ name: 'years_of_experience', type: 'int', nullable: true })
    yearsOfExperience?: number | null;

    @Column({ name: 'working_hours', length: 100, nullable: true })
    workingHours?: string | null; // Ví dụ: "8:00 - 18:00"

    @Column({ name: 'service_areas', type: 'simple-json', nullable: true })
    serviceAreas?: string[] | null; // Các khu vực phục vụ

    @Column({ name: 'created_by', type: 'bigint', nullable: true })
    createdBy?: number | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
