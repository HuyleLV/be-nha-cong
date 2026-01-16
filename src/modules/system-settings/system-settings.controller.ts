import {
    Controller,
    Get,
    Patch,
    Body,
    UseGuards,
    Post,
    Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

@ApiTags('System Settings')
@Controller('admin/system-settings')
export class SystemSettingsController {
    constructor(private readonly service: SystemSettingsService) { }

    @Get('public')
    @ApiOperation({ summary: 'Get public system settings (no auth required)' })
    getPublicSettings() {
        return this.service.getPublicSettings();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @Get()
    @ApiOperation({ summary: 'Get system settings' })
    getSettings() {
        return this.service.getSettings();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @Patch()
    @ApiOperation({ summary: 'Update system settings' })
    updateSettings(@Body() dto: UpdateSystemSettingsDto) {
        return this.service.updateSettings(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @Get('storage-config')
    @ApiOperation({ summary: 'Get storage configuration' })
    getStorageConfig() {
        return this.service.getStorageConfig();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @Post('test-storage/:type')
    @ApiOperation({ summary: 'Test storage connection' })
    testStorageConnection(@Param('type') type: 'local' | 's3' | 'spaces' | 'ftp') {
        return this.service.testStorageConnection(type);
    }
}
