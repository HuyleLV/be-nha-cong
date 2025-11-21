import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsNumberString, IsNumber } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty() @IsString()
  name: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  brand?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  color?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  modelOrYear?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  origin?: string;

  @ApiProperty({ required: false }) @IsOptional()
  value?: string; // numeric string

  @ApiProperty({ required: false }) @IsOptional() @IsInt()
  quantity?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  status?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  warrantyPeriod?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsInt()
  buildingId?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsInt()
  apartmentId?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsInt()
  bedId?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  notes?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  images?: string; // JSON string or comma-separated
}
