import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HostSettings } from './entities/host-settings.entity';
import { HostSettingsService } from './host-settings.service';
import { HostSettingsController } from './host-settings.controller';

@Module({
    imports: [TypeOrmModule.forFeature([HostSettings])],
    controllers: [HostSettingsController],
    providers: [HostSettingsService],
    exports: [HostSettingsService],
})
export class HostSettingsModule { }
