import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { BuildingStatus } from '../entities/building.entity';

export class CreateBuildingDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(180)
  name: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(200)
  slug?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(255)
  address?: string;

  @ApiProperty({ required: false }) @IsOptional()
  locationId?: number;

  @ApiProperty({ required: false, description: 'vĩ độ dạng chuỗi decimal' })
  @IsOptional() @IsString()
  lat?: string;

  @ApiProperty({ required: false, description: 'kinh độ dạng chuỗi decimal' })
  @IsOptional() @IsString()
  lng?: string;

  @ApiProperty({ required: false, default: 0 }) @IsOptional() @IsInt() @Min(0)
  floors?: number;

  @ApiProperty({ required: false, default: 0 }) @IsOptional() @IsInt() @Min(0)
  units?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsInt()
  yearBuilt?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  coverImageUrl?: string;

  @ApiProperty({ required: false, description: 'JSON/CSV ảnh lưu dạng text' })
  @IsOptional() @IsString()
  images?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ enum: ['active','inactive','draft'], default: 'active' })
  @IsOptional() @IsEnum(['active','inactive','draft'])
  status?: BuildingStatus;
}
