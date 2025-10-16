// src/apartments/dto/query-apartment.dto.ts
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { APARTMENT_STATUS, ApartmentStatus } from './create-apartment.dto';

export class QueryApartmentDto {
  /** ID khu vực (location_id) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  locationId?: number;

  /** slug khu vực (ví dụ: ha-dong, ba-dinh, cau-giay...) */
  @IsOptional()
  @IsString()
  locationSlug?: string;

  /** Giá thuê tối thiểu (lọc theo rentPrice) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  /** Giá thuê tối đa */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  /** Diện tích tối thiểu (m2) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minArea?: number;

  /** Diện tích tối đa (m2) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxArea?: number;

  /** Lọc số phòng ngủ */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  /** Lọc số phòng tắm */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  /** Lọc theo trạng thái đăng (draft/published/archived) */
  @IsOptional()
  @IsIn(APARTMENT_STATUS as any)
  status?: ApartmentStatus;

  /** Tìm kiếm theo tiêu đề hoặc mô tả */
  @IsOptional()
  @IsString()
  q?: string;

  /** ===== Lọc theo tiện nghi ===== */
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
  hasAirConditioner?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasWaterHeater?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasWashingMachine?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasWardrobe?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  flexibleHours?: boolean;

  /** ===== Phân trang ===== */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc', 'area_desc'])
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'area_desc';
}
