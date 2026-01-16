import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from './entities/system-settings.entity';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

/**
 * System Settings Service
 * 
 * Manages global system configuration (singleton pattern)
 */
@Injectable()
export class SystemSettingsService {
    private readonly SETTINGS_ID = 1; // Singleton: always use ID = 1

    constructor(
        @InjectRepository(SystemSettings)
        private readonly repo: Repository<SystemSettings>,
    ) { }

    /**
     * Get system settings (create default if not exists)
     */
    async getSettings(): Promise<SystemSettings> {
        let settings = await this.repo.findOne({ where: { id: this.SETTINGS_ID } });

        if (!settings) {
            // Create default settings
            settings = this.repo.create({
                id: this.SETTINGS_ID,
                siteTitle: 'Nhà Cộng',
                siteDescription: null,
                siteLogo: null,
                siteFavicon: null,
                contactEmail: null,
                contactPhone: null,
                contactAddress: null,
                socialMedia: null,
                storageType: 'local',
                storageConfig: null,
                emailConfig: null,
                defaultLanguage: 'vi',
                timezone: 'Asia/Ho_Chi_Minh',
                currency: 'VND',
                dateFormat: 'DD/MM/YYYY',
                metaKeywords: null,
                metaDescription: null,
                googleAnalyticsId: null,
                googleTagManagerId: null,
                features: {
                    enableRegistration: true,
                    enableEmailVerification: false,
                    enablePhoneVerification: false,
                    enableGoogleLogin: true,
                    enableZaloLogin: false,
                    enableMaintenanceMode: false,
                },
                maintenanceMode: false,
                maintenanceMessage: null,
            });
            settings = await this.repo.save(settings);
        }

        return settings;
    }

    /**
     * Update system settings
     */
    async updateSettings(dto: UpdateSystemSettingsDto): Promise<SystemSettings> {
        let settings = await this.repo.findOne({ where: { id: this.SETTINGS_ID } });

        if (!settings) {
            // Create if not exists
            settings = await this.getSettings();
        }

        // Normalize empty strings to null for optional fields
        const normalizedDto: any = { ...dto };
        if (normalizedDto.contactEmail === '') normalizedDto.contactEmail = null;
        if (normalizedDto.contactPhone === '') normalizedDto.contactPhone = null;
        if (normalizedDto.contactAddress === '') normalizedDto.contactAddress = null;
        if (normalizedDto.siteDescription === '') normalizedDto.siteDescription = null;
        if (normalizedDto.siteLogo === '') normalizedDto.siteLogo = null;
        if (normalizedDto.siteFavicon === '') normalizedDto.siteFavicon = null;
        if (normalizedDto.metaKeywords === '') normalizedDto.metaKeywords = null;
        if (normalizedDto.metaDescription === '') normalizedDto.metaDescription = null;
        if (normalizedDto.googleAnalyticsId === '') normalizedDto.googleAnalyticsId = null;
        if (normalizedDto.googleTagManagerId === '') normalizedDto.googleTagManagerId = null;
        if (normalizedDto.maintenanceMessage === '') normalizedDto.maintenanceMessage = null;

        // Merge updates
        Object.assign(settings, normalizedDto);

        // Handle nested objects
        if (dto.socialMedia !== undefined) {
            settings.socialMedia = { ...settings.socialMedia, ...dto.socialMedia };
        }
        if (dto.storageConfig !== undefined) {
            settings.storageConfig = { ...settings.storageConfig, ...dto.storageConfig };
        }
        if (dto.emailConfig !== undefined) {
            settings.emailConfig = { ...settings.emailConfig, ...dto.emailConfig };
        }
        if (dto.features !== undefined) {
            settings.features = { ...settings.features, ...dto.features };
        }

        return await this.repo.save(settings);
    }

    /**
     * Get storage configuration (for upload service)
     */
    async getStorageConfig() {
        const settings = await this.getSettings();
        return {
            type: settings.storageType,
            ...settings.storageConfig,
        };
    }

    /**
     * Test storage connection
     */
    async testStorageConnection(storageType: 'local' | 's3' | 'spaces' | 'ftp'): Promise<{ success: boolean; message: string }> {
        // TODO: Implement storage connection testing
        // This would test the connection to S3, Spaces, FTP, etc.
        return { success: true, message: 'Storage connection test not implemented yet' };
    }

    /**
     * Get public settings (safe for frontend, no sensitive data)
     */
    async getPublicSettings() {
        const settings = await this.getSettings();

        // Return only public-safe fields (exclude storage config, email config, etc.)
        return {
            siteTitle: settings.siteTitle,
            siteDescription: settings.siteDescription,
            siteLogo: settings.siteLogo,
            contactEmail: settings.contactEmail,
            contactPhone: settings.contactPhone,
            contactAddress: settings.contactAddress,
            socialMedia: settings.socialMedia,
            defaultLanguage: settings.defaultLanguage,
            timezone: settings.timezone,
            currency: settings.currency,
            dateFormat: settings.dateFormat,
            metaKeywords: settings.metaKeywords,
            metaDescription: settings.metaDescription,
            googleAnalyticsId: settings.googleAnalyticsId,
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
        };
    }
}
