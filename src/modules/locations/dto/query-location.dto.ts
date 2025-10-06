// locations/dto/query-location.dto.ts
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { LocationLevel } from '../entities/locations.entity';

export class QueryLocationDto {
  @IsOptional() @IsEnum(['Province','City','District'])
  level?: LocationLevel;

  @IsOptional() @Type(() => Number) @IsInt()
  parentId?: number;

  @IsOptional() @IsString()
  q?: string; // tìm theo name/slug (ilike)

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;

  @IsOptional()
  deep?: 'true' | 'false'; // cho GET by parent: include descendants qua path
}
