import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsArray,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNewsDto {
  @ApiProperty({ example: 'Sự kiện ra mắt dịch vụ mới', maxLength: 180 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title: string;

  @ApiPropertyOptional({ example: 'su-kien-ra-mat-dich-vu-moi' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: 'Tóm tắt ngắn gọn về sự kiện...' })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiPropertyOptional({ example: '<p>Nội dung chi tiết...</p>' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/uploads/news/cover.jpg' })
  @IsOptional()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 1, description: '0 = Draft, 1 = Published' })
  @IsNumber()
  @IsOptional()
  status?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @ApiPropertyOptional({ example: ['event', 'update'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  viewCount?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  pointSeo?: number;
  
  @ApiPropertyOptional({ example: 'keyword' })
  @IsString()
  @IsOptional()
  focusKeyword?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  authorId?: number;
}
