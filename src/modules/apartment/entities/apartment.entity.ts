// src/entities/apartment.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

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

  @Column({ name: 'location_id', type: 'int' })
  @Index()
  locationId: number; 

  @Column({ name: 'building_id', type: 'int', nullable: true })
  @Index()
  buildingId?: number | null; 

  /* ========== Address & Geo ========== */
  @Column({ name: 'street_address', length: 200, nullable: true })
  streetAddress?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng?: string;

  /* ========== Specs ========== */
  @Column({ default: 0 })
  bedrooms: number;

  @Column({ default: 0 })
  bathrooms: number;

  @Column({ name: 'living_rooms', default: 0 })
  livingRooms: number;

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

  @Column({ name: 'images', type: 'simple-json', nullable: true })
  images?: string[];


  /* ========== Service fees ========== */
  @Column({ name: 'electricity_price_per_kwh', type: 'int', unsigned: true, nullable: true })
  electricityPricePerKwh?: number;

  @Column({ name: 'water_price_per_m3', type: 'int', unsigned: true, nullable: true })
  waterPricePerM3?: number;

  @Column({ name: 'internet_price_per_room', type: 'int', unsigned: true, nullable: true })
  internetPricePerRoom?: number;

  @Column({ name: 'common_service_fee_per_person', type: 'int', unsigned: true, nullable: true })
  commonServiceFeePerPerson?: number;

  /* ========== Furnitures ========== */
  @Column({ name: 'has_air_conditioner', type: 'bool', default: false })
  hasAirConditioner: boolean;

  @Column({ name: 'has_water_heater', type: 'bool', default: false })
  hasWaterHeater: boolean;

  @Column({ name: 'has_kitchen_cabinet', type: 'bool', default: false })
  hasKitchenCabinet: boolean;

  @Column({ name: 'has_washing_machine', type: 'bool', default: false })
  hasWashingMachine: boolean;

  @Column({ name: 'has_wardrobe', type: 'bool', default: false })
  hasWardrobe: boolean;

  /* ========== Amenities ========== */
  @Column({ name: 'has_private_bathroom', type: 'bool', default: false })
  hasPrivateBathroom: boolean;

  @Column({ name: 'has_shared_bathroom', type: 'bool', default: false })
  hasSharedBathroom: boolean;

  @Column({ name: 'has_washing_machine_shared', type: 'bool', default: false })
  hasWashingMachineShared: boolean;

  @Column({ name: 'has_washing_machine_private', type: 'bool', default: false })
  hasWashingMachinePrivate: boolean;

  @Column({ name: 'has_desk', type: 'bool', default: false })
  hasDesk: boolean;

  @Column({ name: 'has_kitchen_table', type: 'bool', default: false })
  hasKitchenTable: boolean;

  @Column({ name: 'has_range_hood', type: 'bool', default: false })
  hasRangeHood: boolean;

  @Column({ name: 'has_fridge', type: 'bool', default: false })
  hasFridge: boolean;

  @Column({ name: 'has_mezzanine', type: 'bool', default: false })
  hasMezzanine: boolean;

  @Column({ name: 'no_owner_living', type: 'bool', default: false })
  noOwnerLiving: boolean;

  @Column({ name: 'flexible_hours', type: 'bool', default: false })
  flexibleHours: boolean;

  /* ========== New amenities (2025-11): Elevator / EV / Pet ========== */
  @Column({ name: 'has_elevator', type: 'bool', default: false })
  hasElevator: boolean;

  @Column({ name: 'allow_pet', type: 'bool', default: false })
  allowPet: boolean;

  @Column({ name: 'allow_electric_vehicle', type: 'bool', default: false })
  allowElectricVehicle: boolean;

  /* ========== Verification ========== */
  @Column({ name: 'is_verified', type: 'bool', default: false })
  isVerified: boolean;

  /* ========== Meta ========== */
  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdById: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
