import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

/**
 * System Settings Entity
 * 
 * Stores global system configuration and settings
 * Only one record should exist (singleton pattern)
 */
@Entity('system_settings')
export class SystemSettings {
    @PrimaryGeneratedColumn()
    id: number;

    // Website Information
    @Column({ type: 'varchar', length: 255, default: 'Nhà Cộng' })
    siteTitle: string;

    @Column({ type: 'text', nullable: true })
    siteDescription: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    siteLogo: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    siteFavicon: string | null;

    // Contact Information
    @Column({ type: 'varchar', length: 255, nullable: true })
    contactEmail: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    contactPhone: string | null;

    @Column({ type: 'text', nullable: true })
    contactAddress: string | null;

    // Social Media
    @Column({ type: 'json', nullable: true })
    socialMedia: {
        facebook?: string;
        zalo?: string;
        youtube?: string;
        tiktok?: string;
        instagram?: string;
    } | null;

    // Upload Storage Configuration
    @Column({ type: 'varchar', length: 20, default: 'local' })
    storageType: 'local' | 's3' | 'spaces' | 'ftp' | 'cdn';

    @Column({ type: 'json', nullable: true })
    storageConfig: {
        local?: {
            path?: string;
            baseUrl?: string;
        };
        s3?: {
            region?: string;
            bucket?: string;
            accessKeyId?: string;
            secretAccessKey?: string;
            cdnUrl?: string;
        };
        spaces?: {
            endpoint?: string;
            bucket?: string;
            key?: string;
            secret?: string;
            cdnUrl?: string;
        };
        ftp?: {
            host?: string;
            port?: number;
            user?: string;
            password?: string;
            basePath?: string;
            baseUrl?: string;
        };
        cdn?: {
            provider?: string;
            url?: string;
            apiKey?: string;
        };
    } | null;

    // Email Configuration
    @Column({ type: 'json', nullable: true })
    emailConfig: {
        host?: string;
        port?: number;
        secure?: boolean;
        user?: string;
        password?: string;
        from?: string;
        fromName?: string;
    } | null;

    // General Settings
    @Column({ type: 'varchar', length: 50, default: 'vi' })
    defaultLanguage: string;

    @Column({ type: 'varchar', length: 50, default: 'Asia/Ho_Chi_Minh' })
    timezone: string;

    @Column({ type: 'varchar', length: 10, default: 'VND' })
    currency: string;

    @Column({ type: 'varchar', length: 20, default: 'DD/MM/YYYY' })
    dateFormat: string;

    // SEO Settings
    @Column({ type: 'text', nullable: true })
    metaKeywords: string | null;

    @Column({ type: 'text', nullable: true })
    metaDescription: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    googleAnalyticsId: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    googleTagManagerId: string | null;

    // Feature Flags
    @Column({ type: 'json', nullable: true })
    features: {
        enableRegistration?: boolean;
        enableEmailVerification?: boolean;
        enablePhoneVerification?: boolean;
        enableGoogleLogin?: boolean;
        enableZaloLogin?: boolean;
        enableMaintenanceMode?: boolean;
    } | null;

    // Maintenance Mode
    @Column({ type: 'boolean', default: false })
    maintenanceMode: boolean;

    @Column({ type: 'text', nullable: true })
    maintenanceMessage: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
