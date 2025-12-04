import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMeterReadingItemDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  previousIndex?: string;

  @ApiProperty()
  @IsNotEmpty()
  newIndex: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  readingDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  images?: string[];
}

export class CreateMeterReadingDto {
  @ApiProperty()
  @IsInt()
  buildingId: number;

  @ApiProperty()
  @IsInt()
  apartmentId: number;

  @ApiProperty({ enum: ['electricity', 'water'] })
  @IsEnum(['electricity', 'water'])
  meterType: 'electricity' | 'water';

  @ApiProperty({ description: 'YYYY-MM' })
  @IsNotEmpty()
  period: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsNotEmpty()
  @IsDateString()
  readingDate: string;

  @ApiProperty({ type: [CreateMeterReadingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMeterReadingItemDto)
  items: CreateMeterReadingItemDto[];
}
