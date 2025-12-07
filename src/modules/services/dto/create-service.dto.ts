import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsInt, IsNumberString } from 'class-validator';
import { ServiceFeeType, ServicePriceType, ServiceUnit } from '../entities/service.entity';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty() @IsNotEmpty() @IsString()
  name: string;

  @ApiProperty({ required: false }) @IsOptional() @IsEnum(ServiceFeeType)
  feeType?: ServiceFeeType;

  @ApiProperty({ required: false }) @IsOptional() @IsEnum(ServicePriceType)
  priceType?: ServicePriceType;

  @ApiProperty({ required: false }) @IsOptional()
  @IsNumberString()
  taxRate?: string; // stored as numeric string

  @ApiProperty({ required: false }) @IsOptional()
  @IsNumberString()
  unitPrice?: string; // stored as numeric string (decimal)

  @ApiProperty({ required: false }) @IsOptional() @IsEnum(ServiceUnit)
  unit?: ServiceUnit;

  @ApiProperty({ required: false }) @IsOptional() @IsInt()
  @Type(() => Number)
  buildingId?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  note?: string;
}
