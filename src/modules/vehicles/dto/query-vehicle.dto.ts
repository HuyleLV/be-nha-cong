import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString } from 'class-validator';

export class QueryVehicleDto {
  @ApiProperty({ required: false }) @IsOptional()
  page?: number;

  @ApiProperty({ required: false }) @IsOptional()
  limit?: number;

  @ApiProperty({ required: false }) @IsOptional() @IsString()
  q?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsInt()
  buildingId?: number;
}
