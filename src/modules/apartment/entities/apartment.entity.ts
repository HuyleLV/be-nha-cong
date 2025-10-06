// src/entities/apartment.entity.ts
import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn, Index
  } from 'typeorm';
  import { Location } from '../../locations/entities/locations.entity';
  
  export type ApartmentStatus = 'draft' | 'published' | 'archived';
  
  @Entity('apartments')
  export class Apartment {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ length: 200 })
    @Index()
    title: string;
  
    @Column({ length: 220, unique: true })
    slug: string;
  
    // 👇 MÔ TẢ NGẮN
    @Column({ length: 300, nullable: true })
    excerpt?: string;
  
    @Column({ type: 'text', nullable: true })
    description?: string;
  
    @ManyToOne(() => Location, { onDelete: 'RESTRICT', eager: true })
    @JoinColumn({ name: 'location_id' })
    location: Location;
  
    @Column({ name: 'street_address', length: 200, nullable: true })
    streetAddress?: string;
  
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    lat?: string;
  
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    lng?: string;
  
    @Column({ default: 0 })
    bedrooms: number;
  
    @Column({ default: 0 })
    bathrooms: number;
  
    @Column({ name: 'area_m2', type: 'numeric', precision: 7, scale: 2, nullable: true })
    areaM2?: string;
  
    @Column({ name: 'rent_price', type: 'numeric', precision: 12, scale: 2 })
    rentPrice: string;
  
    @Column({ default: 'VND', length: 10 })
    currency: string;
  
    @Column({ default: 'draft', length: 20 })
    status: ApartmentStatus;
  
    @Column({ name: 'cover_image_url', type: 'text', nullable: true })
    coverImageUrl?: string;
  
    // 👇 ID NGƯỜI TẠO
    @Column({ name: 'created_by', type: 'bigint', nullable: true })
    createdById: number;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}  