import { IsOptional, IsObject, ValidateNested, IsString, IsBoolean, IsEnum, IsNumber, IsEmail, ValidateIf } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class SocialMediaDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    facebook?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    zalo?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    youtube?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tiktok?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    instagram?: string;
}

class StorageConfigDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    local?: {
        path?: string;
        baseUrl?: string;
    };

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    s3?: {
        region?: string;
        bucket?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        cdnUrl?: string;
    };

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    spaces?: {
        endpoint?: string;
        bucket?: string;
        key?: string;
        secret?: string;
        cdnUrl?: string;
    };

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    ftp?: {
        host?: string;
        port?: number;
        user?: string;
        password?: string;
        basePath?: string;
        baseUrl?: string;
    };

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    cdn?: {
        provider?: string;
        url?: string;
        apiKey?: string;
    };
}

class EmailConfigDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    host?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    port?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    secure?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    user?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    password?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    from?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fromName?: string;
}

class FeaturesDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    enableRegistration?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    enableEmailVerification?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    enablePhoneVerification?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    enableGoogleLogin?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    enableZaloLogin?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    enableMaintenanceMode?: boolean;
}

export class UpdateSystemSettingsDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    siteTitle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    siteDescription?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    siteLogo?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    siteFavicon?: string;

    @ApiPropertyOptional()
    @Transform(({ value }) => (value === '' || value === undefined) ? null : value)
    @IsOptional()
    @ValidateIf((o) => o.contactEmail !== null && o.contactEmail !== undefined)
    @IsEmail({}, { message: 'Email không hợp lệ' })
    contactEmail?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    contactPhone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    contactAddress?: string;

    @ApiPropertyOptional({ type: SocialMediaDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => SocialMediaDto)
    socialMedia?: SocialMediaDto;

    @ApiPropertyOptional({ enum: ['local', 's3', 'spaces', 'ftp', 'cdn'] })
    @IsOptional()
    @IsEnum(['local', 's3', 'spaces', 'ftp', 'cdn'])
    storageType?: 'local' | 's3' | 'spaces' | 'ftp' | 'cdn';

    @ApiPropertyOptional({ type: StorageConfigDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => StorageConfigDto)
    storageConfig?: StorageConfigDto;

    @ApiPropertyOptional({ type: EmailConfigDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => EmailConfigDto)
    emailConfig?: EmailConfigDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    defaultLanguage?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    timezone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    dateFormat?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    metaKeywords?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    metaDescription?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    googleAnalyticsId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    googleTagManagerId?: string;

    @ApiPropertyOptional({ type: FeaturesDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => FeaturesDto)
    features?: FeaturesDto;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    maintenanceMode?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    maintenanceMessage?: string;
}
