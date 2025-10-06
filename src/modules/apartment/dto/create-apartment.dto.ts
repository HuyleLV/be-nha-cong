// src/apartments/dto/create-apartment.dto.ts
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsIn, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export const APARTMENT_STATUS = ['draft','published','archived'] as const;
export type ApartmentStatus = typeof APARTMENT_STATUS[number];

export class CreateApartmentDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsOptional() @IsString()
  slug?: string;

  // 👇 mô tả ngắn
  @IsOptional() @IsString() @MaxLength(300)
  excerpt?: string;

  @IsOptional() @IsString()
  description?: string;

  @Type(() => Number) @IsInt()
  locationId: number;

  @IsOptional() @IsString()
  streetAddress?: string;

  @IsOptional() @Type(() => Number)
  lat?: number;

  @IsOptional() @Type(() => Number)
  lng?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  bedrooms?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  bathrooms?: number;

  @IsOptional() @Type(() => Number)
  areaM2?: number;

  @Type(() => Number) @IsNumber()
  rentPrice: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsIn(APARTMENT_STATUS as any)
  status?: ApartmentStatus;

  @IsOptional() @IsString()
  coverImageUrl?: string;
}
