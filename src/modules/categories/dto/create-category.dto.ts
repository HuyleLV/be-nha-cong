import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '../entities/category.entity';

export class CreateCategoryDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: ['finance', 'asset', 'job', 'system', 'other'] })
    @IsEnum(['finance', 'asset', 'job', 'system', 'other'])
    type: CategoryType;

    @ApiProperty({ required: false })
    @IsOptional()
    parentId?: number;

    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    meta?: any;
}

export class UpdateCategoryDto extends CreateCategoryDto { }
