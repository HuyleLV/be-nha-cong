import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { AdvertisementPosition, AdvertisementStatus } from '../entities/advertisement.entity';

export class QueryAdvertisementDto {
    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page?: number;

    @ApiPropertyOptional({ example: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number;

    @ApiPropertyOptional({
        enum: ['homepage_banner', 'homepage_slide', 'sidebar', 'detail_page', 'footer', 'popup'],
        description: 'Filter by position',
    })
    @IsOptional()
    @IsEnum(['homepage_banner', 'homepage_slide', 'sidebar', 'detail_page', 'footer', 'popup'])
    position?: AdvertisementPosition;

    @ApiPropertyOptional({
        enum: ['active', 'inactive'],
        description: 'Filter by status',
    })
    @IsOptional()
    @IsEnum(['active', 'inactive'])
    status?: AdvertisementStatus;

    @ApiPropertyOptional({ description: 'Search by title' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({
        description: 'Only get active ads within date range',
        type: Boolean,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    activeOnly?: boolean;
}
