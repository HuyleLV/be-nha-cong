import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Finance (Reports)')
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('host', 'admin')
@ApiBearerAuth()
export class FinanceController {
    constructor(private readonly service: FinanceService) { }

    @Get('cash-flow')
    async getCashFlow(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('buildingId') buildingId?: number
    ) {
        return this.service.getCashFlow(new Date(startDate), new Date(endDate), buildingId);
    }

    @Get('profit-loss')
    async getProfitLoss(
        @Query('year') year: number,
        @Query('period') period?: string
    ) {
        return this.service.getProfitLoss(year, period);
    }

    @Get('debts')
    async getDebts(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20
    ) {
        return this.service.getDebts(page, limit);
    }

    @Get('brokerage')
    async getBrokerage(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20
    ) {
        return this.service.getBrokerageFees(page, limit);
    }

    @Get('assets')
    async getAssets() {
        return this.service.getAssetReport();
    }
}
