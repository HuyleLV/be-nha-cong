import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RentCalculationService } from './rent-calculation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Rent Calculation')
@Controller('rent-calculation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('host', 'admin')
@ApiBearerAuth()
export class RentCalculationController {
    constructor(private readonly service: RentCalculationService) { }

    @Post('calculate')
    @ApiOperation({ summary: 'Calculate and create invoice manually' })
    async calculate(@Body() body: { contractId: number; period: string }, @Req() req: any) {
        const userId = req.user?.id ?? req.user?.sub;
        return this.service.calculateAndCreateInvoice(body.contractId, body.period, userId);
    }
}
