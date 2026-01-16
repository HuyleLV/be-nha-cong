import {
    IsString,
    IsOptional,
    IsEnum,
    IsInt,
    IsDateString,
    Length,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdvertisementPosition, AdvertisementStatus } from '../entities/advertisement.entity';

export class CreateAdvertisementDto {
    @ApiProperty({
        example: 'Banner quảng cáo chính',
        description: 'Tiêu đề quảng cáo',
        minLength: 1,
        maxLength: 200,
    })
    @IsString()
    @Length(1, 200)
    title!: string;

    @ApiProperty({
        enum: ['homepage_banner', 'homepage_slide', 'sidebar', 'detail_page', 'footer', 'popup'],
        description: 'Vị trí hiển thị',
        example: 'homepage_banner',
    })
    @IsEnum(['homepage_banner', 'homepage_slide', 'sidebar', 'detail_page', 'footer', 'popup'])
    position!: AdvertisementPosition;

    @ApiPropertyOptional({
        example: '/uploads/ads/banner.jpg',
        description: 'URL ảnh quảng cáo',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @Length(1, 500)
    imageUrl?: string;

    @ApiPropertyOptional({
        example: '/uploads/ads/video.mp4',
        description: 'URL video quảng cáo',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @Length(1, 500)
    videoUrl?: string;

    @ApiPropertyOptional({
        example: 'https://example.com',
        description: 'Link đích khi click vào quảng cáo',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @Length(1, 500)
    linkUrl?: string;

    @ApiPropertyOptional({
        example: 0,
        description: 'Thứ tự ưu tiên (số càng cao càng hiển thị trước)',
        minimum: 0,
        default: 0,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    priority?: number;

    @ApiPropertyOptional({
        example: '2024-01-01T00:00:00Z',
        description: 'Ngày bắt đầu hiển thị',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        example: '2024-12-31T23:59:59Z',
        description: 'Ngày kết thúc hiển thị',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        enum: ['active', 'inactive'],
        description: 'Trạng thái',
        default: 'active',
    })
    @IsOptional()
    @IsEnum(['active', 'inactive'])
    status?: AdvertisementStatus;

    @ApiPropertyOptional({
        example: 'Mô tả quảng cáo',
        description: 'Mô tả chi tiết',
    })
    @IsOptional()
    @IsString()
    @Length(1, 5000)
    description?: string;
}
