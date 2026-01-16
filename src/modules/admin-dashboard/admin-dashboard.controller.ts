import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('Admin Dashboard')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminDashboardController {
    constructor(private readonly service: AdminDashboardService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    getStats() {
        return this.service.getStats();
    }

    @Get('activities')
    @ApiOperation({ summary: 'Get recent activities' })
    getRecentActivities(@Query('limit') limit?: number) {
        return this.service.getRecentActivities(limit ? parseInt(limit.toString(), 10) : 10);
    }

    @Get('revenue')
    @ApiOperation({ summary: 'Get revenue chart data' })
    getRevenueChart(@Query('period') period?: 'week' | 'month' | 'year') {
        return this.service.getRevenueChart(period || 'month');
    }
}
