// src/apartments/dto/create-apartment.dto.ts
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsNumberString,
} from 'class-validator';
import { Type } from 'class-transformer';

export const APARTMENT_STATUS = ['draft', 'published', 'archived'] as const;
export type ApartmentStatus = typeof APARTMENT_STATUS[number];

export class CreateApartmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  /** DB yêu cầu NOT NULL; có thể để optional để service tự sinh khi thiếu */
  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  /** Liên kết Location qua khóa ngoại: gửi locationId từ client */
  @Type(() => Number)
  @IsInt()
  locationId: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  streetAddress?: string;

  /** entity: decimal(10,7) → dùng string trong DB */
  @IsOptional()
  @IsNumberString()
  lat?: string;

  /** entity: decimal(10,7) → dùng string trong DB */
  @IsOptional()
  @IsNumberString()
  lng?: string;

  /** default 0 trong DB, cho phép gửi lên để override */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  /** default 0 trong DB, cho phép gửi lên để override */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  /** entity: numeric(7,2) → string trong DB */
  @IsOptional()
  @IsNumberString()
  areaM2?: string;

  /** entity: numeric(12,2) → string trong DB (bắt buộc) */
  @IsNumberString()
  rentPrice: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string; // default: VND

  @IsOptional()
  @IsIn(APARTMENT_STATUS as any)
  status?: ApartmentStatus; // default: draft

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  // ===== Phí dịch vụ =====
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  electricityPricePerKwh?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  waterPricePerM3?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  internetPricePerRoom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  commonServiceFeePerPerson?: number;

  // ===== Nội thất =====
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasAirConditioner?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasWaterHeater?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasKitchenCabinet?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasWashingMachine?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasWardrobe?: boolean;

  // ===== Tiện nghi =====
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasPrivateBathroom?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasMezzanine?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  noOwnerLiving?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  flexibleHours?: boolean;

  /** ID người tạo (entity: bigint, nullable) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  createdById?: number;
}
