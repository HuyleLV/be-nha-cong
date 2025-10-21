import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApartmentStatus } from '../entities/apartment.entity';

export class QueryApartmentDto {
  @ApiPropertyOptional({ default: 1 }) 
  @IsOptional() 
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 }) 
  @IsOptional() 
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'tìm theo tiêu đề/địa chỉ' })
  @IsOptional() 
  @IsString()
  q?: string;

  @ApiPropertyOptional() 
  @IsOptional()
  locationId?: number;

  @ApiPropertyOptional() 
  @IsOptional()
  buildingId?: number;

  @ApiPropertyOptional() 
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional() 
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional() 
  @IsOptional()
  bedrooms?: number;

  @ApiPropertyOptional() 
  @IsOptional()
  bathrooms?: number;

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

  // lọc theo số lượng ảnh tối thiểu
  @ApiPropertyOptional({ description: 'yêu cầu số ảnh tối thiểu' })
  @IsOptional()
  minImages?: number;
}
