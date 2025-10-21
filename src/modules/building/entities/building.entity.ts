import {
    Entity, PrimaryGeneratedColumn, Column, Index, Unique,
    CreateDateColumn, UpdateDateColumn
  } from 'typeorm';
  
  export type BuildingStatus = 'active' | 'inactive' | 'draft';
  
  @Entity('buildings')
  @Unique(['locationId', 'slug'])
  export class Building {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ length: 180 })
    @Index()
    name: string;
  
    @Column({ length: 200 })
    slug: string;
  
    @Column({ nullable: true, length: 255 })
    address?: string;

    @Column({ name: 'location_id', nullable: true })
    locationId?: number | null;
  
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    lat?: string | null;
  
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    lng?: string | null;
  
    @Column({ type: 'int', default: 0 })
    floors: number;
  
    @Column({ type: 'int', default: 0 })
    units: number;
  
    @Column({ type: 'int', nullable: true })
    yearBuilt?: number | null;
  
    @Column({ name: 'cover_image_url', nullable: true })
    coverImageUrl?: string | null;
  
    @Column({ type: 'text', nullable: true })
    images?: string | null;
  
    @Column({ type: 'text', nullable: true })
    description?: string | null;
  
    @Column({ type: 'enum', enum: ['active', 'inactive', 'draft'], default: 'active' })
    status: BuildingStatus;
  
    @Column({ name: 'created_by', nullable: true })
    createdBy?: number | null;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  }
  