// src/apartments/dto/query-apartment.dto.ts
import { IsInt, IsNumber, IsOptional, IsString, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { APARTMENT_STATUS, ApartmentStatus } from './create-apartment.dto';

export class QueryApartmentDto {
  @IsOptional() @Type(() => Number) @IsInt()
  locationId?: number;

  @IsOptional() @IsString()
  locationSlug?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  maxPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  bedrooms?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  bathrooms?: number;

  @IsOptional() @IsIn(APARTMENT_STATUS as any)
  status?: ApartmentStatus;

  @IsOptional() @IsString()
  q?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number = 20;
}
