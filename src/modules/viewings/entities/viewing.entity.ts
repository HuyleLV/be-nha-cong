// src/viewings/entities/viewing.entity.ts
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    Index
  } from 'typeorm';
  
  export type ViewingStatus = 'pending' | 'confirmed' | 'cancelled';
  
  @Entity('viewings')
  @Index(['apartmentId', 'preferredAt'])
  @Index(['userId'])
  export class Viewing {
    @PrimaryGeneratedColumn()
    id: number;
  
    /** FK mềm – không join cứng */
    @Column({ type: 'int' })
    apartmentId: number;
  
    /** Nếu user đã đăng nhập */
    @Column({ type: 'int', nullable: true })
    userId: number | null;
  
    /** Thông tin liên hệ (có thể lấy từ user, hoặc khách tự nhập) */
    @Column({ type: 'varchar', length: 120 })
    name: string;
  
    @Column({ type: 'varchar', length: 120, nullable: true })
    email: string | null;
  
    @Column({ type: 'varchar', length: 30, nullable: true })
    phone: string | null;
  
    /** Thời điểm mong muốn xem phòng */
    @Column({ type: 'datetime' })
    preferredAt: Date;
  
    /** Ghi chú của khách */
    @Column({ type: 'text', nullable: true })
    note: string | null;
  
    /** Trạng thái xử lý */
    @Column({ type: 'varchar', length: 20, default: 'pending' })
    status: ViewingStatus;
  
    /** Nhân sự admin xử lý (nếu có) */
    @Column({ type: 'int', nullable: true })
    processedById: number | null;
  
    /** Ghi chú xử lý nội bộ */
    @Column({ type: 'text', nullable: true })
    staffNote: string | null;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  