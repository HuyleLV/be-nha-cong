import { IsEnum, IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import type { LocationLevel } from '../entities/locations.entity';

export class CreateLocationDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  slug?: string; 

  @IsEnum(['Province', 'City', 'District'])
  level: LocationLevel;

  @IsOptional() @Type(() => Number) @IsInt()
  parentId?: number | null;

  @IsOptional() @IsString()
  coverImageUrl?: string;
}
