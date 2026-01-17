import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Points')
@Controller('points')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PointsController {
    constructor(private readonly service: PointsService) { }

    @Get('my-balance')
    @Roles('user', 'customer', 'resident')
    async myBalance(@Req() req: any) {
        const userId = req.user.id ?? req.user.sub;
        const balance = await this.service.getBalance(userId);
        return { balance };
    }

    @Get('my-history')
    @Roles('user', 'customer', 'resident')
    async myHistory(@Query('page') page: number, @Query('limit') limit: number, @Req() req: any) {
        const userId = req.user.id ?? req.user.sub;
        return this.service.getHistory(userId, page, limit);
    }

    // Admin/Host endpoints to manage points
    @Get('user/:userId')
    @Roles('admin', 'host')
    async getUserPoints(@Param('userId') id: number) {
        const balance = await this.service.getBalance(Number(id));
        const { items } = await this.service.getHistory(Number(id), 1, 5);
        return { balance, recentHistory: items };
    }

    @Post('adjust')
    @Roles('admin', 'host')
    async adjustPoints(@Body() body: { userId: number; amount: number; type?: string; description: string }, @Req() req: any) {
        const adminId = req.user.id ?? req.user.sub;
        return this.service.addTransaction(body.userId, body.amount, body.type || 'manual_adjust', body.description, adminId);
    }
}
