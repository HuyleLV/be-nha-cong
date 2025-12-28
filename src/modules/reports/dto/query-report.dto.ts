import { IsOptional, IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryReportDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  buildingId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  apartmentId?: number;
}
