import { IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ProfileDto {
    @ApiPropertyOptional()
    @IsOptional()
    displayName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    bio?: string;
}

class NotificationsDto {
    @ApiPropertyOptional({ default: true })
    @IsOptional()
    email?: boolean;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    sms?: boolean;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    push?: boolean;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    bookingAlerts?: boolean;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    paymentAlerts?: boolean;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    contractAlerts?: boolean;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    taskAlerts?: boolean;
}

class PaymentDto {
    @ApiPropertyOptional()
    @IsOptional()
    bankName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    accountNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    accountHolder?: string;

    @ApiPropertyOptional()
    @IsOptional()
    bankBranch?: string;
}

class StorageDto {
    @ApiPropertyOptional({ enum: ['local', 's3', 'spaces'] })
    @IsOptional()
    preferredType?: 'local' | 's3' | 'spaces';

    @ApiPropertyOptional()
    @IsOptional()
    customCdnUrl?: string;
}

class PreferencesDto {
    @ApiPropertyOptional()
    @IsOptional()
    language?: string;

    @ApiPropertyOptional()
    @IsOptional()
    timezone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    dateFormat?: string;

    @ApiPropertyOptional()
    @IsOptional()
    currency?: string;
}

export class UpdateHostSettingsDto {
    @ApiPropertyOptional({ type: ProfileDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => ProfileDto)
    profile?: ProfileDto;

    @ApiPropertyOptional({ type: NotificationsDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => NotificationsDto)
    notifications?: NotificationsDto;

    @ApiPropertyOptional({ type: PaymentDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => PaymentDto)
    payment?: PaymentDto;

    @ApiPropertyOptional({ type: StorageDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => StorageDto)
    storage?: StorageDto;

    @ApiPropertyOptional({ type: PreferencesDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => PreferencesDto)
    preferences?: PreferencesDto;
}
