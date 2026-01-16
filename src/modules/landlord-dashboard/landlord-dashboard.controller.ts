import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { LandlordDashboardService } from './landlord-dashboard.service';

@ApiTags('Landlord Dashboard')
@Controller('landlord/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('host', 'admin', 'manager')
@ApiBearerAuth()
export class LandlordDashboardController {
    constructor(private readonly service: LandlordDashboardService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    getStats(@Req() req: any) {
        const userId = req.user?.id ?? req.user?.sub;
        return this.service.getDashboardStats(userId);
    }

    @Get('revenue')
    @ApiOperation({ summary: 'Get revenue report' })
    getRevenueReport(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
        const userId = req.user?.id ?? req.user?.sub;
        return this.service.getRevenueReport(userId, from, to);
    }

    @Get('contracts')
    @ApiOperation({ summary: 'Get recent contracts' })
    getContracts(@Req() req: any, @Query('status') status?: string) {
        const userId = req.user?.id ?? req.user?.sub;
        return this.service.getContracts(userId, status);
    }

    @Get('rent/upcoming')
    @ApiOperation({ summary: 'Get upcoming rent schedules' })
    getUpcomingRent(@Req() req: any) {
        const userId = req.user?.id ?? req.user?.sub;
        return this.service.getUpcomingRent(userId);
    }

    @Get('rent/overdue')
    @ApiOperation({ summary: 'Get overdue rent schedules' })
    getOverdue(@Req() req: any) {
        const userId = req.user?.id ?? req.user?.sub;
        return this.service.getOverdue(userId);
    }
}
