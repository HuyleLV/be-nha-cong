import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateBedDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'numeric string, e.g. "6500000"' }) @IsString()
  @IsNotEmpty()
  rentPrice: string;

  @ApiProperty({ required: false, description: 'numeric string deposit' }) @IsOptional() @IsString()
  depositAmount?: string;

  @ApiProperty({ required: false, description: 'ID of the apartment' }) @IsOptional()
  @Type(() => Number)
  @IsNumber()
  apartmentId?: number;

  @ApiProperty({ required: false, description: 'active|inactive|draft', default: 'active' }) @IsOptional() @IsString()
  status?: string = 'active';
}
