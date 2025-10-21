import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { OwnershipRole } from '../entities/ownership.entity';

export class QueryOwnershipDto {
  @ApiPropertyOptional() @IsOptional() @IsInt()
  userId?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt()
  buildingId?: number;

  @ApiPropertyOptional({ enum: ['owner','manager','editor','viewer'] })
  @IsOptional() @IsEnum(['owner','manager','editor','viewer'])
  role?: OwnershipRole;

  @ApiPropertyOptional({ default: 1 }) @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 }) @IsOptional()
  limit?: number = 20;
}