import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryServiceDto {
  @ApiProperty({ required: false }) 
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false }) 
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false }) 
  @IsOptional() 
  @IsString()
  q?: string;

  @ApiProperty({ required: false }) 
  @IsOptional() 
  @Type(() => Number) 
  @IsInt()
  buildingId?: number;
}
