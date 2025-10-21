import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive,
  IsString, MaxLength, Min, ArrayMaxSize
} from 'class-validator';
import { ApartmentStatus } from '../entities/apartment.entity';

export class CreateApartmentDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200)
  title: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(220)
  slug?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(300)
  excerpt?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  description?: string;

  @ApiProperty() @IsInt() @IsPositive()
  locationId: number;

  @ApiProperty({ required: false }) @IsOptional() @IsInt()
  buildingId?: number | null;

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(200)
  streetAddress?: string;

  @ApiProperty({ required: false, description: 'decimal string' })
  @IsOptional() @IsString()
  lat?: string;

  @ApiProperty({ required: false, description: 'decimal string' })
  @IsOptional() @IsString()
  lng?: string;

  @ApiProperty({ default: 0 }) @IsOptional() @IsInt() @Min(0)
  bedrooms?: number;

  @ApiProperty({ default: 0 }) @IsOptional() @IsInt() @Min(0)
  bathrooms?: number;

  @ApiProperty({ required: false, description: 'numeric string, ví dụ "25.5"' })
  @IsOptional() @IsString()
  areaM2?: string;

  @ApiProperty({ description: 'numeric string, ví dụ "5500000"' })
  @IsString() @IsNotEmpty()
  rentPrice: string;

  @ApiProperty({ default: 'VND' }) @IsOptional() @IsString() @MaxLength(10)
  currency?: string = 'VND';

  @ApiProperty({ enum: ['draft','published','archived'], default: 'draft' })
  @IsOptional() @IsEnum(['draft','published','archived'])
  status?: ApartmentStatus = 'draft';

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  coverImageUrl?: string;

  // ====== Gallery images ======
  @ApiProperty({ type: [String], required: false, description: 'Danh sách URL ảnh' })
  @IsOptional() @IsArray() @ArrayMaxSize(50)
  @IsString({ each: true })
  images?: string[];

  // ====== Fees ======
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0)
  electricityPricePerKwh?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0)
  waterPricePerM3?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0)
  internetPricePerRoom?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0)
  commonServiceFeePerPerson?: number;

  // ====== Furnitures ======
  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasAirConditioner?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasWaterHeater?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasKitchenCabinet?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasWashingMachine?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasWardrobe?: boolean;

  // ====== Amenities ======
  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasPrivateBathroom?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasMezzanine?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  noOwnerLiving?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  flexibleHours?: boolean;
}
