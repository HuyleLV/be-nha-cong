import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryViewingDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : parseInt(value, 10)))
  @IsInt()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : parseInt(value, 10)))
  @IsInt()
  limit?: number;

  @IsOptional() @IsString() q?: string;  
  @IsOptional() 
  @Transform(({ value }) => (value === undefined ? value : parseInt(value, 10)))
  @IsInt() 
  apartmentId?: number;

  /** Optional: filter by buildingId (via apartment.buildingId) */
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? value : parseInt(value, 10)))
  @IsInt()
  buildingId?: number;
  @IsOptional() @IsIn(['pending','confirmed','cancelled','visited'])
  status?: 'pending' | 'confirmed' | 'cancelled' | 'visited';
}
