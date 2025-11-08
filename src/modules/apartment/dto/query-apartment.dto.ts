import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApartmentStatus } from '../entities/apartment.entity';

export class QueryApartmentDto {
  @ApiPropertyOptional({ default: 1 }) 
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 }) 
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'tìm theo tiêu đề/địa chỉ' })
  @IsOptional() 
  @IsString()
  q?: string;

  @ApiPropertyOptional() 
  @IsOptional()
  @Type(() => Number)
  locationId?: number;

  @ApiPropertyOptional({ description: 'lọc theo location.slug (ví dụ ha-tay)' })
  @IsOptional()
  @IsString()
  locationSlug?: string;

  @ApiPropertyOptional() 
  @IsOptional()
  @Type(() => Number)
  buildingId?: number;

  @ApiPropertyOptional() 
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional() 
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional() 
  @IsOptional()
  @Type(() => Number)
  bedrooms?: number;

  @ApiPropertyOptional() 
  @IsOptional()
  @Type(() => Number)
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'số phòng khách' })
  @IsOptional()
  @Type(() => Number)
  livingRooms?: number;

  @ApiPropertyOptional({ description: 'số khách' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  guests?: number;

  @ApiPropertyOptional({ enum: ['draft','published','archived'] })
  @IsOptional() 
  @IsEnum(['draft','published','archived'])
  status?: ApartmentStatus;

  // quick boolean filters
  @ApiPropertyOptional() 
  @IsOptional() 
  @IsBooleanString()
  hasPrivateBathroom?: string;

  @ApiPropertyOptional() 
  @IsOptional() 
  @IsBooleanString()
  hasMezzanine?: string;

  @ApiPropertyOptional() 
  @IsOptional() 
  @IsBooleanString()
  hasAirConditioner?: string;

  @ApiPropertyOptional() 
  @IsOptional() 
  @IsBooleanString()
  hasWashingMachine?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  hasSharedBathroom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  hasWashingMachineShared?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  hasWashingMachinePrivate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  hasWardrobe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  hasDesk?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  hasKitchenTable?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  hasKitchenCabinet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  hasRangeHood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  hasFridge?: string;

  // lọc theo số lượng ảnh tối thiểu
  @ApiPropertyOptional({ description: 'yêu cầu số ảnh tối thiểu' })
  @IsOptional()
  @Type(() => Number)
  minImages?: number;
}
