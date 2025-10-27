import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { BuildingStatus } from '../entities/building.entity';

export class QueryBuildingDto {
  @ApiPropertyOptional({ default: 1 }) 
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 }) 
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'từ khoá theo name/address' })
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  locationId?: number;

  @ApiPropertyOptional({ enum: ['active','inactive','draft'] })
  @IsOptional() @IsEnum(['active','inactive','draft'])
  status?: BuildingStatus;
}
