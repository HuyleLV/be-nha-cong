import {
    IsOptional,
    IsNumber,
    IsEnum,
    IsString,
    IsBoolean,
    IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
    ServiceType,
    ServiceProviderStatus,
} from '../entities/service-provider.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryServiceProviderDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;

    @IsOptional()
    @IsString()
    q?: string; // Search query

    @IsOptional()
    @IsEnum(ServiceType)
    serviceType?: ServiceType;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    locationId?: number;

    @ApiPropertyOptional({
        type: [Number],
        example: [1, 2, 3],
        description: 'Filter by multiple location IDs',
    })
    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    @Type(() => Number)
    locationIds?: number[];

    @IsOptional()
    @IsEnum(ServiceProviderStatus)
    status?: ServiceProviderStatus;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minRating?: number;

    @IsOptional()
    @IsBoolean()
    isVerified?: boolean;

    @ApiPropertyOptional({ example: 100000, description: 'Minimum price (VND)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minPrice?: number;

    @ApiPropertyOptional({ example: 5000000, description: 'Maximum price (VND)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxPrice?: number;

    @ApiPropertyOptional({
        enum: ['pending', 'approved', 'rejected', 'under_review', 'needs_revision', 'null'],
        description: 'Filter by approval status',
    })
    @IsOptional()
    @IsString()
    approvalStatus?: string;

    @ApiPropertyOptional({ example: 0, description: 'Filter by priority' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    priority?: number;
}
