import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class QueryAssetDto {
  @ApiProperty({ required: false }) @IsOptional()
  page?: number;

  @ApiProperty({ required: false }) @IsOptional()
  limit?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  q?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  status?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsInt()
  buildingId?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsInt()
  apartmentId?: number;
}
