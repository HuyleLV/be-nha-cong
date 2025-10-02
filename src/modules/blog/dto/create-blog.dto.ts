import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsBoolean,
    IsArray,
    IsNumber,
    IsUrl,
    MaxLength,
  } from 'class-validator';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  
  export class CreateBlogDto {
    @ApiProperty({ example: 'Bí quyết SEO cho website bán hàng', maxLength: 180 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(180)
    title: string;
  
    @ApiPropertyOptional({ example: 'bi-quyet-seo-cho-website-ban-hang' })
    @IsString()
    @IsOptional()
    slug?: string;
  
    @ApiPropertyOptional({
      example: 'Bài viết hướng dẫn cách tối ưu SEO cho website...',
    })
    @IsString()
    @IsOptional()
    excerpt?: string;
  
    @ApiPropertyOptional({
      example: '<p>Nội dung chi tiết bài viết...</p>',
    })
    @IsString()
    @IsOptional()
    content?: string;
  
    @ApiPropertyOptional({
      example: 'https://example.com/uploads/blog/seo-cover.jpg',
    })
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
  
    @ApiPropertyOptional({ example: ['seo', 'marketing'] })
    @IsArray()
    @IsOptional()
    tags?: string[];
  
    @ApiPropertyOptional({ example: 0 })
    @IsNumber()
    @IsOptional()
    viewCount?: number;
  
    @ApiPropertyOptional({ example: 5 })
    @IsNumber()
    @IsOptional()
    authorId?: number;
  }
  