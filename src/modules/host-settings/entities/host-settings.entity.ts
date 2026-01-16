import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

/**
 * Host Settings Entity
 * 
 * Stores configuration and preferences for host users
 */
@Entity('host_settings')
export class HostSettings {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @Column({ type: 'json', nullable: true })
    profile: {
        displayName?: string;
        phone?: string;
        email?: string;
        address?: string;
        bio?: string;
    } | null;

    @Column({ type: 'json', nullable: true })
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
        bookingAlerts: boolean;
        paymentAlerts: boolean;
        contractAlerts: boolean;
        taskAlerts: boolean;
    } | null;

    @Column({ type: 'json', nullable: true })
    payment: {
        bankName?: string;
        accountNumber?: string;
        accountHolder?: string;
        bankBranch?: string;
    } | null;

    @Column({ type: 'json', nullable: true })
    storage: {
        preferredType?: 'local' | 's3' | 'spaces';
        customCdnUrl?: string;
    } | null;

    @Column({ type: 'json', nullable: true })
    preferences: {
        language?: string;
        timezone?: string;
        dateFormat?: string;
        currency?: string;
    } | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
