import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum RentScheduleStatus {
    PENDING = 'pending',
    PAID = 'paid',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
}

@Entity('rent_schedules')
export class RentSchedule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'contract_id' })
    @Index()
    contractId: number;

    @Column({ name: 'apartment_id' })
    @Index()
    apartmentId: number;

    @Column({ name: 'customer_id' })
    @Index()
    customerId: number;

    @Column({ name: 'scheduled_date', type: 'date' })
    @Index()
    scheduledDate: Date;

    @Column({ name: 'amount', type: 'decimal', precision: 14, scale: 2 })
    amount: string;

    @Column({
        type: 'enum',
        enum: RentScheduleStatus,
        default: RentScheduleStatus.PENDING,
    })
    status: RentScheduleStatus;

    @Column({ name: 'invoice_id', nullable: true })
    @Index()
    invoiceId?: number | null;

    @Column({ name: 'payment_id', nullable: true })
    @Index()
    paymentId?: number | null;

    @Column({ name: 'reminder_sent_at', type: 'datetime', nullable: true })
    reminderSentAt?: Date | null;

    @Column({
        name: 'late_fee',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    })
    lateFee: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
