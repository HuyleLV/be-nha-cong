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

  // ===== Phí dịch vụ =====
  @Column({ name: 'electricity_price_per_kwh', type: 'int', unsigned: true, nullable: true })
  electricityPricePerKwh?: number; // ví dụ: 4000

  @Column({ name: 'water_price_per_m3', type: 'int', unsigned: true, nullable: true })
  waterPricePerM3?: number; // ví dụ: 35000

  @Column({ name: 'internet_price_per_room', type: 'int', unsigned: true, nullable: true })
  internetPricePerRoom?: number; // ví dụ: 100000

  @Column({ name: 'common_service_fee_per_person', type: 'int', unsigned: true, nullable: true })
  commonServiceFeePerPerson?: number; // ví dụ: 130000 (đ/người hoặc theo số lượng)

  // ===== Nội thất =====
  @Column({ name: 'has_air_conditioner', type: 'bool', default: false })
  hasAirConditioner: boolean; // Điều hoà

  @Column({ name: 'has_water_heater', type: 'bool', default: false })
  hasWaterHeater: boolean; // Nóng lạnh

  @Column({ name: 'has_kitchen_cabinet', type: 'bool', default: false })
  hasKitchenCabinet: boolean; // Kệ bếp

  @Column({ name: 'has_washing_machine', type: 'bool', default: false })
  hasWashingMachine: boolean; // Máy giặt

  @Column({ name: 'has_wardrobe', type: 'bool', default: false })
  hasWardrobe: boolean; // Tủ quần áo

  // ===== Tiện nghi =====
  @Column({ name: 'has_private_bathroom', type: 'bool', default: false })
  hasPrivateBathroom: boolean; // Vệ sinh khép kín

  @Column({ name: 'has_mezzanine', type: 'bool', default: false })
  hasMezzanine: boolean; // Gác xép

  @Column({ name: 'no_owner_living', type: 'bool', default: false })
  noOwnerLiving: boolean; // Không chung chủ

  @Column({ name: 'flexible_hours', type: 'bool', default: false })
  flexibleHours: boolean; // Giờ linh hoạt

  // ID người tạo
  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdById: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}