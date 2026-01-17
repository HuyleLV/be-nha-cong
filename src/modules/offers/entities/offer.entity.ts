import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('offers')
export class Offer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    title: string;

    @Column({ length: 255, nullable: true })
    image: string;

    @Column({ length: 255, nullable: true })
    partner_name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'longtext', nullable: true })
    content: string; // HTML content

    @Column({ name: 'start_date', type: 'datetime', nullable: true })
    startDate?: Date;

    @Column({ name: 'end_date', type: 'datetime', nullable: true })
    endDate?: Date;

    @Column({ default: true })
    active: boolean;

    @Column({ name: 'created_by', nullable: true })
    createdBy?: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
