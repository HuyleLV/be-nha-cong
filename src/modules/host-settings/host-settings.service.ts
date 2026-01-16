import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HostSettings } from './entities/host-settings.entity';
import { UpdateHostSettingsDto } from './dto/update-host-settings.dto';

/**
 * Host Settings Service
 * 
 * Manages host user settings and preferences
 */
@Injectable()
export class HostSettingsService {
    constructor(
        @InjectRepository(HostSettings)
        private readonly repo: Repository<HostSettings>,
    ) { }

    /**
     * Get settings for a user, create if not exists
     */
    async getSettings(userId: number): Promise<HostSettings> {
        let settings = await this.repo.findOne({ where: { userId } });

        if (!settings) {
            // Create default settings
            settings = this.repo.create({
                userId,
                profile: null,
                notifications: {
                    email: true,
                    sms: false,
                    push: true,
                    bookingAlerts: true,
                    paymentAlerts: true,
                    contractAlerts: true,
                    taskAlerts: true,
                },
                payment: null,
                storage: null,
                preferences: {
                    language: 'vi',
                    timezone: 'Asia/Ho_Chi_Minh',
                    dateFormat: 'DD/MM/YYYY',
                    currency: 'VND',
                },
            });
            settings = await this.repo.save(settings);
        }

        return settings;
    }

    /**
     * Update settings for a user
     */
    async updateSettings(userId: number, dto: UpdateHostSettingsDto): Promise<HostSettings> {
        let settings = await this.repo.findOne({ where: { userId } });

        if (!settings) {
            // Create if not exists
            settings = await this.getSettings(userId);
        }

        // Merge updates
        if (dto.profile !== undefined) {
            settings.profile = { ...settings.profile, ...dto.profile };
        }
        if (dto.notifications !== undefined) {
            settings.notifications = { ...settings.notifications, ...dto.notifications };
        }
        if (dto.payment !== undefined) {
            settings.payment = { ...settings.payment, ...dto.payment };
        }
        if (dto.storage !== undefined) {
            settings.storage = { ...settings.storage, ...dto.storage };
        }
        if (dto.preferences !== undefined) {
            settings.preferences = { ...settings.preferences, ...dto.preferences };
        }

        return await this.repo.save(settings);
    }

    /**
     * Delete settings for a user
     */
    async deleteSettings(userId: number): Promise<boolean> {
        const result = await this.repo.delete({ userId });
        return result.affected !== undefined && result.affected > 0;
    }
}
