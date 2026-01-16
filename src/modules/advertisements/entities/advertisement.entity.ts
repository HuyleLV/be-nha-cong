import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export type AdvertisementPosition =
    | 'homepage_banner'
    | 'homepage_slide'
    | 'sidebar'
    | 'detail_page'
    | 'footer'
    | 'popup';

export type AdvertisementStatus = 'active' | 'inactive';

@Entity('advertisements')
export class Advertisement {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 200 })
    title: string;

    @Column({
        type: 'varchar',
        length: 50,
    })
    @Index()
    position: AdvertisementPosition;

    @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
    imageUrl?: string | null;

    @Column({ name: 'video_url', type: 'varchar', length: 500, nullable: true })
    videoUrl?: string | null;

    @Column({ name: 'link_url', type: 'varchar', length: 500, nullable: true })
    linkUrl?: string | null; // Link đích khi click

    @Column({ type: 'int', default: 0 })
    priority: number; // Thứ tự hiển thị

    @Column({ name: 'start_date', type: 'datetime', nullable: true })
    startDate?: Date | null;

    @Column({ name: 'end_date', type: 'datetime', nullable: true })
    endDate?: Date | null;

    @Column({ type: 'varchar', length: 20, default: 'active' })
    @Index()
    status: AdvertisementStatus;

    @Column({ name: 'click_count', type: 'int', default: 0 })
    clickCount: number; // Số lần click

    @Column({ name: 'view_count', type: 'int', default: 0 })
    viewCount: number; // Số lần xem

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ name: 'created_by', type: 'bigint', nullable: true })
    createdBy?: number | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
