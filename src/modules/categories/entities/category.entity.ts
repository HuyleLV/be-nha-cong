import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export type CategoryType = 'finance' | 'asset' | 'job' | 'system' | 'other';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    @Index()
    name: string;

    @Column({ length: 100, unique: true })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: ['finance', 'asset', 'job', 'system', 'other'],
        default: 'other',
    })
    @Index()
    type: CategoryType;

    // For nested categories if needed (e.g. Finance > Income)
    @Column({ nullable: true })
    parentId?: number;

    @Column({ default: true })
    isActive: boolean;

    // Metadata for system settings (e.g. Zalo OA ID/Secret stored as JSON)
    @Column({ type: 'simple-json', nullable: true })
    meta?: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
