import {
    IsNotEmpty,
    IsString,
    IsEnum,
    IsOptional,
    IsEmail,
    IsNumber,
    IsBoolean,
    IsArray,
    IsInt,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    ServiceType,
    ServiceProviderStatus,
} from '../entities/service-provider.entity';

export class CreateServiceProviderDto {
    @ApiProperty({ example: 'Nguyễn Văn A', description: 'Tên thợ/dịch vụ' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'SEO-friendly URL slug (auto-generated if not provided)' })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiProperty({
        example: 'dien',
        description: 'Loại dịch vụ',
        enum: ServiceType,
    })
    @IsNotEmpty()
    @IsEnum(ServiceType)
    serviceType: ServiceType;

    @ApiProperty({ example: '0987654321', description: 'Số điện thoại' })
    @IsNotEmpty()
    @IsString()
    phone: string;

    @ApiPropertyOptional({ example: 'tho@example.com', description: 'Email' })
    @IsOptional()
    @IsEmail()
    email?: string | null;

    @ApiPropertyOptional({ example: 1, description: 'ID khu vực' })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => (value === '' ? null : value))
    locationId?: number | null;

    @ApiPropertyOptional({
        example: '123 Đường ABC, Quận XYZ',
        description: 'Địa chỉ',
    })
    @IsOptional()
    @IsString()
    address?: string | null;

    @ApiPropertyOptional({
        example: 4.5,
        description: 'Đánh giá (0-5)',
        minimum: 0,
        maximum: 5,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(5)
    @Transform(({ value }) => (value === '' ? null : value))
    rating?: number | null;

    @ApiPropertyOptional({
        example: 10,
        description: 'Số lượng đánh giá',
        minimum: 0,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Transform(({ value }) => (value === '' ? null : value))
    reviews?: number;

    @ApiPropertyOptional({
        example: 'https://example.com/avatar.jpg',
        description: 'URL ảnh đại diện',
    })
    @IsOptional()
    @IsString()
    avatarUrl?: string | null;

    @ApiPropertyOptional({
        example: 'Thợ điện chuyên nghiệp, có 10 năm kinh nghiệm',
        description: 'Mô tả dịch vụ',
    })
    @IsOptional()
    @IsString()
    description?: string | null;

    @ApiPropertyOptional({ example: '500000', description: 'Giá từ (VND)' })
    @IsOptional()
    @IsString()
    priceFrom?: string | null;

    @ApiPropertyOptional({ example: '2000000', description: 'Giá đến (VND)' })
    @IsOptional()
    @IsString()
    priceTo?: string | null;

    @ApiPropertyOptional({
        example: 'active',
        description: 'Trạng thái',
        enum: ServiceProviderStatus,
        default: 'active',
    })
    @IsOptional()
    @IsEnum(ServiceProviderStatus)
    status?: ServiceProviderStatus;

    @ApiPropertyOptional({
        example: false,
        description: 'Đã được xác minh',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isVerified?: boolean;

    @ApiPropertyOptional({
        example: 5,
        description: 'Số năm kinh nghiệm',
        minimum: 0,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Transform(({ value }) => (value === '' ? null : value))
    yearsOfExperience?: number | null;

    @ApiPropertyOptional({ example: '8:00 - 18:00', description: 'Giờ làm việc' })
    @IsOptional()
    @IsString()
    workingHours?: string | null;

    @ApiPropertyOptional({
        example: ['Cầu Giấy', 'Đống Đa', 'Ba Đình'],
        description: 'Các khu vực phục vụ',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    serviceAreas?: string[] | null;

    @ApiPropertyOptional({
        enum: ['pending', 'approved', 'rejected', 'under_review', 'needs_revision'],
        description: 'Trạng thái kiểm duyệt (tự động set pending khi customer tạo)',
        example: 'pending',
    })
    @IsOptional()
    @IsEnum(['pending', 'approved', 'rejected', 'under_review', 'needs_revision'])
    approvalStatus?: 'pending' | 'approved' | 'rejected' | 'under_review' | 'needs_revision';

    @ApiPropertyOptional({
        example: 0,
        description: 'Mức ưu tiên (-100 đến 100, số càng cao càng ưu tiên)',
        minimum: -100,
        maximum: 100,
    })
    @IsOptional()
    @IsInt()
    @Min(-100)
    @Max(100)
    @Transform(({ value }) => (value === '' ? null : value))
    priority?: number;

    @ApiPropertyOptional({
        example: 'Ghi chú kiểm duyệt',
        description: 'Ghi chú từ admin khi kiểm duyệt',
    })
    @IsOptional()
    @IsString()
    approvalNote?: string;
}
