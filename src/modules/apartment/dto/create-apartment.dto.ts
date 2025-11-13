import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive,
  IsString, Max, MaxLength, Min, ArrayMaxSize
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

  @ApiProperty({ default: 0 }) @IsOptional() @IsInt() @Min(0)
  livingRooms?: number;
  
  @ApiProperty({ required: false, description: 'Mã phòng/căn hộ nội bộ (ví dụ P302, A12)' })
  @IsOptional() @IsString() @MaxLength(50)
  roomCode?: string;

  @ApiProperty({ required: false, description: 'Sức chứa (số người ở tối đa)' })
  @IsOptional() @IsInt() @Min(0)
  guests?: number;

  @ApiProperty({ required: false, description: 'Tầng trong tòa nhà (>=1), null nếu chưa gán' })
  @IsOptional() @IsInt() @Min(1)
  floorNumber?: number;

  @ApiProperty({ required: false, description: 'numeric string, ví dụ "25.5"' })
  @IsOptional() @IsString()
  areaM2?: string;

  @ApiProperty({ description: 'numeric string, ví dụ "5500000"' })
  @IsString() @IsNotEmpty()
  rentPrice: string;

  @ApiProperty({ default: 'VND' }) @IsOptional() @IsString() @MaxLength(10)
  currency?: string = 'VND';

  @ApiProperty({ required: false, description: 'Ưu đãi (%), 0-100' })
  @IsOptional() @IsInt() @Min(0) @Max(100)
  discountPercent?: number;

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

  @ApiProperty({ required: false, description: 'Ghi chú về phí dịch vụ' })
  @IsOptional() @IsString()
  serviceFeeNote?: string;

  // ====== Section notes (2025-11) ======
  @ApiProperty({ required: false, description: 'Ghi chú hiển thị dưới danh sách nội thất' })
  @IsOptional() @IsString()
  furnitureNote?: string;

  @ApiProperty({ required: false, description: 'Ghi chú hiển thị dưới danh sách tiện nghi' })
  @IsOptional() @IsString()
  amenitiesNote?: string;

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

  // ===== Additional furnitures (2025-11) =====
  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasBed?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasMattress?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasBedding?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasDressingTable?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasSofa?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasSharedBathroom?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasWashingMachineShared?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasWashingMachinePrivate?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasDesk?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasKitchenTable?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasRangeHood?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasFridge?: boolean;

  // ====== Amenities ======
  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasPrivateBathroom?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasMezzanine?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  noOwnerLiving?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  flexibleHours?: boolean;

  // ===== New amenities (2025-11) =====
  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  hasElevator?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  allowPet?: boolean;

  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean()
  allowElectricVehicle?: boolean;

  // ===== Verification =====
  @ApiProperty({ required: false, default: false })
  @IsOptional() @IsBoolean()
  isVerified?: boolean;
}
