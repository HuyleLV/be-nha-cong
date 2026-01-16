import {
    Controller,
    Get,
    Patch,
    Body,
    UseGuards,
    Req,
    Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HostSettingsService } from './host-settings.service';
import { UpdateHostSettingsDto } from './dto/update-host-settings.dto';

@ApiTags('Host Settings')
@Controller('host/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('host')
@ApiBearerAuth()
export class HostSettingsController {
    constructor(private readonly service: HostSettingsService) { }

    @Get()
    @ApiOperation({ summary: 'Get host settings' })
    getSettings(@Req() req: any) {
        const userId = req.user?.id ?? req.user?.sub;
        return this.service.getSettings(userId);
    }

    @Patch()
    @ApiOperation({ summary: 'Update host settings' })
    updateSettings(@Req() req: any, @Body() dto: UpdateHostSettingsDto) {
        const userId = req.user?.id ?? req.user?.sub;
        return this.service.updateSettings(userId, dto);
    }

    @Delete()
    @ApiOperation({ summary: 'Delete host settings (reset to defaults)' })
    deleteSettings(@Req() req: any) {
        const userId = req.user?.id ?? req.user?.sub;
        return this.service.deleteSettings(userId);
    }
}
